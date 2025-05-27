<script lang="ts">
    import { onMount } from 'svelte';
    import { TaskService } from '../services/taskService';
    import api from '../lib/api';
    import type { CreateTaskRequest, User, Project } from '../lib/types/task';

    // Props
    export let isOpen = false;
    export let onClose: () => void;
    export let onTaskCreated: () => void;
    export let preselectedProjectId: number | null = null;

    // Estados del formulario
    let title = '';
    let description = '';
    let status = 'Todo';
    let priority = 'Medium';
    let dueDate = '';
    let estimatedHours: number | null = null;
    let actualHours = '';
    let projectId: number | null = preselectedProjectId;
    let assigneeId: number | null = null;

    // Estados de la aplicación
    let loading = false;
    let error: string | null = null;
    let projects: Project[] = [];
    let members: User[] = [];

    // Obtener usuario del localStorage
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const userId = user?.id || 0;

    // Cargar datos iniciales
    async function loadInitialData() {
        try {
            loading = true;
            error = null;

            const token = localStorage.getItem('token');
            if (!token || !userId) {
                throw new Error('No hay token de autenticación o usuario');
            }

            // Cargar proyectos del usuario
            const projectsResponse = await api.get(`/projects/owner/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            projects = projectsResponse.data;

            // Si hay un proyecto preseleccionado o solo hay uno, cargar sus miembros
            if (preselectedProjectId) {
                projectId = preselectedProjectId;
                await loadProjectMembers(preselectedProjectId);
            } else if (projects.length === 1) {
                projectId = projects[0].id;
                await loadProjectMembers(projects[0].id);
            }
        } catch (err) {
            console.error('Error cargando datos iniciales:', err);
            error = 'Error al cargar los datos. Por favor, intente de nuevo.';
        } finally {
            loading = false;
        }
    }

    // Cargar miembros del proyecto
    async function loadProjectMembers(selectedProjectId: number) {
        try {
            members = await TaskService.getProjectMembers(selectedProjectId);
        } catch (err) {
            console.error('Error al cargar miembros del proyecto:', err);
            members = [];
        }
    }

    // Manejar cambio de proyecto
    async function handleProjectChange() {
        if (projectId) {
            await loadProjectMembers(projectId);
            // Resetear asignado cuando cambia el proyecto
            assigneeId = null;
        } else {
            members = [];
            assigneeId = null;
        }
    }

    // Crear tarea
    async function handleCreateTask() {
        if (!projectId) {
            error = 'Debe seleccionar un proyecto';
            return;
        }

        try {
            loading = true;
            error = null;

            const taskData: CreateTaskRequest = {
                title: title.trim(),
                description: description.trim() || undefined,
                status: status as any,
                priority: priority as any,
                dueDate: dueDate || undefined,
                estimatedHours: estimatedHours || undefined,
                actualHours: actualHours.trim() || undefined,
                project_id: projectId,
                assignee_id: assigneeId || undefined
            };

            await TaskService.createTask(taskData);
            
            // Notificar éxito y cerrar modal
            onTaskCreated();
            closeModal();
        } catch (err: any) {
            console.error('Error al crear tarea:', err);
            if (err?.response?.status === 400) {
                error = 'Datos inválidos. Por favor, revise la información ingresada.';
            } else if (err?.response?.status === 403) {
                error = 'No tienes permisos para crear tareas en este proyecto.';
            } else {
                error = `Error al crear la tarea: ${err.message}`;
            }
        } finally {
            loading = false;
        }
    }

    // Cerrar modal y resetear formulario
    function closeModal() {
        isOpen = false;
        resetForm();
        onClose();
    }

    // Resetear formulario
    function resetForm() {
        title = '';
        description = '';
        status = 'Todo';
        priority = 'Medium';
        dueDate = '';
        estimatedHours = null;
        actualHours = '';
        projectId = preselectedProjectId;
        assigneeId = null;
        members = [];
        error = null;
    }

    // Obtener nombre completo del miembro
    function getMemberDisplayName(member: User): string {
        if (member.username) return member.username;
        if (member.firstName && member.lastName) 
            return `${member.firstName} ${member.lastName}`;
        return member.firstName || member.lastName || `Usuario #${member.id}`;
    }

    // Reactive statements
    $: if (isOpen) {
        loadInitialData();
    }

    $: if (!isOpen) {
        resetForm();
    }

    $: if (projectId) {
        handleProjectChange();
    }
</script>

{#if isOpen}
    <div class="modal-backdrop" on:click={closeModal}>
        <div class="modal-content" on:click|stopPropagation>
            <div class="modal-header">
                <h2>Crear Nueva Tarea</h2>
                <button class="close-btn" on:click={closeModal}>×</button>
            </div>

            <div class="modal-body">
                {#if loading && projects.length === 0}
                    <div class="loading-container">
                        <div class="spinner"></div>
                        <p>Cargando datos...</p>
                    </div>
                {:else if error}
                    <div class="error-alert">
                        {error}
                    </div>
                {/if}

                <form on:submit|preventDefault={handleCreateTask}>
                    <div class="form-group">
                        <label for="create-title">Título *</label>
                        <input
                            id="create-title"
                            type="text"
                            bind:value={title}
                            required
                            placeholder="Ingrese el título de la tarea"
                            class="form-input"
                            disabled={loading}
                        />
                    </div>

                    <div class="form-group">
                        <label for="create-description">Descripción</label>
                        <textarea
                            id="create-description"
                            bind:value={description}
                            rows="3"
                            placeholder="Descripción detallada de la tarea (opcional)"
                            class="form-textarea"
                            disabled={loading}
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label for="create-project">Proyecto *</label>
                        <select 
                            id="create-project" 
                            bind:value={projectId} 
                            required
                            class="form-select"
                            disabled={loading || preselectedProjectId !== null}
                        >
                            <option value={null}>Seleccione un proyecto</option>
                            {#each projects as project}
                                <option value={project.id}>{project.name}</option>
                            {/each}
                        </select>
                        {#if preselectedProjectId}
                            <small class="form-text">Proyecto preseleccionado</small>
                        {/if}
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="create-status">Estado</label>
                            <select id="create-status" bind:value={status} class="form-select" disabled={loading}>
                                <option value="Todo">Por Hacer</option>
                                <option value="In Progress">En Progreso</option>
                                <option value="Review">En Revisión</option>
                                <option value="Done">Completado</option>
                                <option value="Blocked">Bloqueado</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="create-priority">Prioridad</label>
                            <select id="create-priority" bind:value={priority} class="form-select" disabled={loading}>
                                <option value="Low">Baja</option>
                                <option value="Medium">Media</option>
                                <option value="High">Alta</option>
                                <option value="Critical">Crítica</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="create-dueDate">Fecha límite</label>
                            <input
                                id="create-dueDate"
                                type="date"
                                bind:value={dueDate}
                                class="form-input"
                                disabled={loading}
                            />
                        </div>

                        <div class="form-group">
                            <label for="create-assignee">Asignar a</label>
                            <select id="create-assignee" bind:value={assigneeId} class="form-select" disabled={loading}>
                                <option value={null}>Sin asignar</option>
                                {#each members as member}
                                    <option value={member.id}>
                                        {getMemberDisplayName(member)}
                                        {#if member.role} ({member.role}){/if}
                                    </option>
                                {/each}
                            </select>
                            {#if !projectId}
                                <small class="form-text">Seleccione un proyecto para ver los miembros</small>
                            {:else if members.length === 0}
                                <small class="form-text">Este proyecto no tiene miembros asignados</small>
                            {/if}
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="create-estimatedHours">Horas estimadas</label>
                            <input
                                id="create-estimatedHours"
                                type="number"
                                min="0"
                                step="0.5"
                                bind:value={estimatedHours}
                                placeholder="0"
                                class="form-input"
                                disabled={loading}
                            />
                        </div>

                        <div class="form-group">
                            <label for="create-actualHours">Horas reales</label>
                            <input
                                id="create-actualHours"
                                type="text"
                                bind:value={actualHours}
                                placeholder="Ej: 2.5 o 2h 30m"
                                class="form-input"
                                disabled={loading}
                            />
                            <small class="form-text">Se puede llenar después</small>
                        </div>
                    </div>
                </form>
            </div>

            <div class="modal-footer">
                <button 
                    class="btn btn-secondary" 
                    on:click={closeModal}
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button 
                    class="btn btn-primary" 
                    on:click={handleCreateTask}
                    disabled={loading || !title.trim() || !projectId}
                >
                    {#if loading}
                        <span class="loading-spinner"></span>
                        Creando...
                    {:else}
                        Crear Tarea
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(15, 23, 42, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
    }

    .modal-content {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border-radius: 12px;
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(148, 163, 184, 0.2);
        animation: modalFadeIn 0.3s ease-out;
    }

    @keyframes modalFadeIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(30, 41, 59, 0.8);
        border-radius: 12px 12px 0 0;
    }

    .modal-header h2 {
        margin: 0;
        color: #f8fafc;
        font-size: 1.25rem;
        font-weight: 600;
        font-family: 'Inter', sans-serif;
    }

    .close-btn {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
    }

    .close-btn:hover {
        background-color: rgba(239, 68, 68, 0.2);
        color: #ef4444;
    }

    .modal-body {
        padding: 24px;
        color: #f8fafc;
    }

    .loading-container {
        text-align: center;
        padding: 40px;
        color: #94a3b8;
    }

    .spinner {
        display: inline-block;
        width: 40px;
        height: 40px;
        border: 3px solid #3b82f6;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
    }

    .loading-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
        margin-right: 6px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .error-alert {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid #ef4444;
        border-radius: 8px;
        padding: 16px;
        color: #ef4444;
        margin-bottom: 16px;
    }

    .form-group {
        margin-bottom: 16px;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    .form-group label {
        display: block;
        margin-bottom: 6px;
        color: #f8fafc;
        font-weight: 500;
        font-size: 14px;
        font-family: 'Inter', sans-serif;
    }

    .form-input, .form-textarea, .form-select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid rgba(148, 163, 184, 0.3);
        border-radius: 6px;
        background-color: rgba(15, 23, 42, 0.6);
        color: #f8fafc;
        font-size: 14px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        font-family: 'Inter', sans-serif;
    }

    .form-input:focus, .form-textarea:focus, .form-select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    }

    .form-input:disabled, .form-textarea:disabled, .form-select:disabled {
        background-color: rgba(15, 23, 42, 0.8);
        color: #64748b;
        cursor: not-allowed;
    }

    .form-input::placeholder, .form-textarea::placeholder {
        color: #64748b;
    }

    .form-text {
        font-size: 12px;
        color: #64748b;
        margin-top: 4px;
        display: block;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px;
        border-top: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(30, 41, 59, 0.8);
        border-radius: 0 0 12px 12px;
    }

    .btn {
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: 'Inter', sans-serif;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: #2563eb;
    }

    .btn-secondary {
        background-color: #64748b;
        color: white;
    }

    .btn-secondary:hover:not(:disabled) {
        background-color: #475569;
    }

    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            margin: 20px;
        }

        .form-row {
            grid-template-columns: 1fr;
            gap: 12px;
        }

        .modal-footer {
            flex-direction: column;
        }

        .btn {
            width: 100%;
            justify-content: center;
        }
    }
</style>