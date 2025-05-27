<script lang="ts">
    import { onMount } from 'svelte';
    import { TaskService } from '../services/taskService';
    import TaskCommentsModal from './TaskCommentsModal.svelte';
    import type { Task, UpdateTaskRequest, User } from '../lib/types/task';

    // Props
    export let isOpen = false;
    export let taskId: number | null = null;
    export let onClose: () => void;
    export let onTaskUpdated: () => void;
    export let onTaskDeleted: (() => void) | null = null;

    // Estados
    let task: Task | null = null;
    let loading = false;
    let error: string | null = null;
    let editMode = false;
    let members: User[] = [];
    let confirmDelete = false;
    let showCommentsModal = false;

    // Estados para edición
    let editTitle = '';
    let editDescription = '';
    let editStatus = '';
    let editPriority = '';
    let editDueDate = '';
    let editAssigneeId: number | null = null;
    let editEstimatedHours: number | null = null;
    let editActualHours = '';

    // Cargar detalles de la tarea
    async function loadTaskDetails() {
        if (!taskId) return;

        try {
            loading = true;
            error = null;

            // Obtener detalles de la tarea
            task = await TaskService.getTaskById(taskId);

            // Inicializar campos de edición
            editTitle = task.title || '';
            editDescription = task.description || '';
            editStatus = task.status || 'Todo';
            editPriority = task.priority || 'Medium';
            editDueDate = formatDateForInput(task.dueDate);
            editAssigneeId = task.assignee_id || null;
            editEstimatedHours = task.estimatedHours || null;
            editActualHours = task.actualHours || '';

            // Cargar miembros del proyecto
            if (task.project_id) {
                try {
                    members = await TaskService.getProjectMembers(task.project_id);
                } catch (err) {
                    console.error('Error al cargar miembros del proyecto:', err);
                }
            }
        } catch (err) {
            console.error('Error al cargar detalles de la tarea:', err);
            error = 'Error al cargar los detalles de la tarea. Por favor, intente de nuevo.';
        } finally {
            loading = false;
        }
    }

    // Guardar cambios
    async function handleSaveChanges() {
        if (!task) return;

        try {
            loading = true;
            error = null;

            // Preparar datos para actualización
            const updateData: UpdateTaskRequest = {};

            // Solo añadir campos que realmente han cambiado
            if (editTitle !== task.title) updateData.title = editTitle;
            if (editDescription !== task.description) updateData.description = editDescription || undefined;
            if (editStatus !== task.status) updateData.status = editStatus as any;
            if (editPriority !== task.priority) updateData.priority = editPriority as any;
            if (editDueDate !== formatDateForInput(task.dueDate)) updateData.dueDate = editDueDate || undefined;
            if (editAssigneeId !== task.assignee_id) updateData.assignee_id = editAssigneeId || undefined;
            if ((editEstimatedHours || 0) !== (task.estimatedHours || 0)) updateData.estimatedHours = editEstimatedHours || undefined;
            if (editActualHours !== task.actualHours) updateData.actualHours = editActualHours || undefined;

            // Verificar si hay datos para actualizar
            if (Object.keys(updateData).length === 0) {
                editMode = false;
                return;
            }

            // Actualizar la tarea
            const updatedTask = await TaskService.updateTask(task.id, updateData);
            task = updatedTask;

            // Cerrar modo edición
            editMode = false;
            handleTaskUpdate();
        } catch (err: any) {
            console.error('Error al guardar cambios:', err);
            if (err?.response?.status === 403) {
                error = 'No tienes permisos para editar esta tarea. Solo el propietario del proyecto o miembros pueden editar tareas.';
            } else {
                error = `Error al guardar los cambios: ${err.message}`;
            }
        } finally {
            loading = false;
        }
    }

    // Eliminar tarea
    async function handleDeleteTask() {
        if (!task) return;

        try {
            loading = true;
            error = null;

            if (!confirmDelete) {
                confirmDelete = true;
                loading = false;
                return;
            }

            await TaskService.deleteTask(task.id);
            handleTaskDelete();
        } catch (err: any) {
            console.error('Error al eliminar la tarea:', err);
            if (err?.response?.status === 403) {
                error = 'No tienes permisos para eliminar esta tarea. Solo el propietario del proyecto puede eliminar tareas.';
            } else {
                error = 'Error al eliminar la tarea. Por favor, intente de nuevo.';
            }
            confirmDelete = false;
        } finally {
            loading = false;
        }
    }

    // Cerrar modal
    function closeModal() {
        isOpen = false;
        editMode = false;
        confirmDelete = false;
        error = null;
        task = null;
        onClose();
    }

    // Manejar actualización exitosa
    function handleTaskUpdate() {
        onTaskUpdated();
        closeModal();
    }

    // Manejar eliminación exitosa
    function handleTaskDelete() {
        if (onTaskDeleted) {
            onTaskDeleted();
        } else {
            onTaskUpdated();
        }
        closeModal();
    }

    // Formatear fecha para input
    function formatDateForInput(dateStr?: string): string {
        if (!dateStr) return '';
        try {
            return dateStr.split('T')[0];
        } catch {
            return '';
        }
    }

    // Formatear fecha para mostrar
    function formatDisplayDate(dateStr?: string): string {
        if (!dateStr) return 'No definida';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return 'Fecha inválida';
        }
    }

    // Obtener nombre de asignado
    function getAssigneeName(assigneeId?: number): string {
        if (!assigneeId) return 'Sin asignar';
        
        const assignee = members.find(u => u.id === assigneeId);
        if (assignee) {
            if (assignee.username) return assignee.username;
            if (assignee.firstName && assignee.lastName) 
                return `${assignee.firstName} ${assignee.lastName}`;
            return assignee.firstName || assignee.lastName || `Usuario #${assigneeId}`;
        }
        
        return `Usuario ID: ${assigneeId}`;
    }

    // Mapeos de texto
    const statusTextMap: Record<string, string> = {
        'Todo': 'Por Hacer',
        'In Progress': 'En Progreso',
        'Review': 'En Revisión',
        'Done': 'Completado',
        'Blocked': 'Bloqueado'
    };

    const priorityTextMap: Record<string, string> = {
        'Low': 'Baja',
        'Medium': 'Media',
        'High': 'Alta',
        'Critical': 'Crítica'
    };

    // Clases CSS para badges
    function getStatusClass(status?: string): string {
        switch (status) {
            case 'Todo': return 'estado-pendiente';
            case 'In Progress': return 'estado-progreso';
            case 'Review': return 'estado-revision';
            case 'Done': return 'estado-completado';
            case 'Blocked': return 'estado-bloqueado';
            default: return 'estado-pendiente';
        }
    }

    function getPriorityClass(priority?: string): string {
        switch (priority) {
            case 'Low': return 'prioridad-baja';
            case 'Medium': return 'prioridad-media';
            case 'High': return 'prioridad-alta';
            case 'Critical': return 'prioridad-critica';
            default: return '';
        }
    }

    // Reactive statements
    $: if (isOpen && taskId) {
        loadTaskDetails();
    }

    $: if (!isOpen) {
        task = null;
        editMode = false;
        confirmDelete = false;
        error = null;
    }
</script>

{#if isOpen}
    <div class="modal-backdrop" on:click={closeModal}>
        <div class="modal-content" on:click|stopPropagation>
            <div class="modal-header">
                <h2>
                    {#if editMode}
                        Editar Tarea
                    {:else if confirmDelete}
                        Confirmar Eliminación
                    {:else if task}
                        Detalles de la tarea: {task.title}
                    {:else}
                        Detalles de la Tarea
                    {/if}
                </h2>
                <button class="close-btn" on:click={closeModal}>×</button>
            </div>

            <div class="modal-body">
                {#if loading}
                    <div class="loading-container">
                        <div class="spinner"></div>
                        <p>Cargando...</p>
                    </div>
                {:else if error}
                    <div class="error-alert">
                        {error}
                    </div>
                {:else if confirmDelete && task}
                    <div class="delete-confirmation">
                        <p>¿Estás seguro de que deseas eliminar esta tarea?</p>
                        <p><strong>Título:</strong> {task.title}</p>
                        <p>Esta acción no se puede deshacer.</p>
                    </div>
                {:else if task}
                    <div class="task-details">
                        {#if editMode}
                            <!-- Formulario de edición -->
                            <form on:submit|preventDefault={handleSaveChanges}>
                                <div class="form-group">
                                    <label for="edit-title">Título</label>
                                    <input
                                        id="edit-title"
                                        type="text"
                                        bind:value={editTitle}
                                        required
                                        class="form-input"
                                    />
                                </div>

                                <div class="form-group">
                                    <label for="edit-description">Descripción</label>
                                    <textarea
                                        id="edit-description"
                                        bind:value={editDescription}
                                        rows="3"
                                        class="form-textarea"
                                    ></textarea>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-status">Estado</label>
                                        <select id="edit-status" bind:value={editStatus} class="form-select">
                                            <option value="Todo">Por Hacer</option>
                                            <option value="In Progress">En Progreso</option>
                                            <option value="Review">En Revisión</option>
                                            <option value="Done">Completado</option>
                                            <option value="Blocked">Bloqueado</option>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label for="edit-priority">Prioridad</label>
                                        <select id="edit-priority" bind:value={editPriority} class="form-select">
                                            <option value="Low">Baja</option>
                                            <option value="Medium">Media</option>
                                            <option value="High">Alta</option>
                                            <option value="Critical">Crítica</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-dueDate">Fecha límite</label>
                                        <input
                                            id="edit-dueDate"
                                            type="date"
                                            bind:value={editDueDate}
                                            class="form-input"
                                        />
                                    </div>

                                    <div class="form-group">
                                        <label for="edit-assignee">Asignado a</label>
                                        <select id="edit-assignee" bind:value={editAssigneeId} class="form-select">
                                            <option value={null}>Sin asignar</option>
                                            {#each members as member}
                                                <option value={member.id}>
                                                    {member.username || 
                                                     (member.firstName && member.lastName 
                                                       ? `${member.firstName} ${member.lastName}` 
                                                       : member.firstName || member.lastName || `Usuario #${member.id}`)}
                                                    {#if member.role} ({member.role}){/if}
                                                </option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="edit-estimatedHours">Horas estimadas</label>
                                        <input
                                            id="edit-estimatedHours"
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            bind:value={editEstimatedHours}
                                            class="form-input"
                                        />
                                    </div>

                                    <div class="form-group">
                                        <label for="edit-actualHours">Horas reales</label>
                                        <input
                                            id="edit-actualHours"
                                            type="text"
                                            bind:value={editActualHours}
                                            class="form-input"
                                        />
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label>Proyecto</label>
                                    <input
                                        type="text"
                                        value={task.project?.name || ''}
                                        disabled
                                        class="form-input disabled"
                                    />
                                    <small class="form-text">No se puede cambiar el proyecto de una tarea existente</small>
                                </div>
                            </form>
                        {:else}
                            <!-- Vista de detalles -->
                            <div class="detail-section">
                                <div class="detail-item">
                                    <h5>Título</h5>
                                    <p>{task.title}</p>
                                </div>

                                <div class="detail-item">
                                    <h5>Descripción</h5>
                                    <p>{task.description || 'No hay descripción'}</p>
                                </div>

                                <div class="detail-row">
                                    <div class="detail-item">
                                        <h5>Estado</h5>
                                        <span class={`estado-badge ${getStatusClass(task.status)}`}>
                                            {statusTextMap[task.status] || task.status}
                                        </span>
                                    </div>

                                    <div class="detail-item">
                                        <h5>Prioridad</h5>
                                        <span class={`prioridad-badge ${getPriorityClass(task.priority)}`}>
                                            {priorityTextMap[task.priority] || task.priority}
                                        </span>
                                    </div>
                                </div>

                                <div class="detail-row">
                                    <div class="detail-item">
                                        <h5>Fecha límite</h5>
                                        <p>{formatDisplayDate(task.dueDate)}</p>
                                    </div>

                                    <div class="detail-item">
                                        <h5>Asignado a</h5>
                                        <p>{getAssigneeName(task.assignee_id)}</p>
                                    </div>
                                </div>

                                <div class="detail-row">
                                    <div class="detail-item">
                                        <h5>Horas estimadas</h5>
                                        <p>{task.estimatedHours || 'No definidas'}</p>
                                    </div>

                                    <div class="detail-item">
                                        <h5>Horas reales</h5>
                                        <p>{task.actualHours || 'No registradas'}</p>
                                    </div>
                                </div>

                                <div class="detail-item">
                                    <h5>Proyecto</h5>
                                    <p>{task.project?.name || 'No asignado a proyecto'}</p>
                                </div>

                                <div class="detail-row">
                                    <div class="detail-item">
                                        <h5>Creado</h5>
                                        <p>{formatDisplayDate(task.createdAt)}</p>
                                    </div>

                                    <div class="detail-item">
                                        <h5>Última actualización</h5>
                                        <p>{formatDisplayDate(task.updatedAt)}</p>
                                    </div>
                                </div>

                                {#if task.completedAt}
                                    <div class="detail-item">
                                        <h5>Completado</h5>
                                        <p>{formatDisplayDate(task.completedAt)}</p>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>

            <div class="modal-footer">
                {#if confirmDelete}
                    <!-- Botones para confirmación de eliminación -->
                    <button 
                        class="btn btn-secondary" 
                        on:click={() => confirmDelete = false}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button 
                        class="btn btn-danger" 
                        on:click={handleDeleteTask}
                        disabled={loading}
                    >
                        {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
                    </button>
                {:else if editMode}
                    <!-- Botones para modo edición -->
                    <button 
                        class="btn btn-secondary" 
                        on:click={() => editMode = false}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button 
                        class="btn btn-primary" 
                        on:click={handleSaveChanges}
                        disabled={loading || !editTitle}
                    >
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                {:else}
                    <!-- Botones para modo visualización -->
                    <button 
                        class="btn btn-danger" 
                        on:click={() => confirmDelete = true}
                        disabled={loading}
                    >
                        Eliminar
                    </button>
                    <button 
                        class="btn btn-primary" 
                        on:click={() => editMode = true}
                        disabled={loading}
                    >
                        Editar
                    </button>
                    <button 
                        class="btn btn-info" 
                        on:click={() => showCommentsModal = true}
                        disabled={loading}
                    >
                        💬 Comentarios y Archivos
                    </button>
                    <button 
                        class="btn btn-secondary" 
                        on:click={closeModal}
                        disabled={loading}
                    >
                        Cerrar
                    </button>
                {/if}
            </div>
        </div>
    </div>
{/if}

<!-- Modal de comentarios -->
{#if task && showCommentsModal}
    <TaskCommentsModal
        bind:isOpen={showCommentsModal}
        taskId={task.id}
        taskTitle={task.title}
        onClose={() => showCommentsModal = false}
    />
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
        max-width: 800px;
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

    .delete-confirmation {
        text-align: center;
        padding: 20px;
    }

    .delete-confirmation p {
        margin: 8px 0;
        color: #94a3b8;
    }

    .delete-confirmation strong {
        color: #f8fafc;
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

    .form-input.disabled {
        background-color: rgba(15, 23, 42, 0.8);
        color: #64748b;
        cursor: not-allowed;
    }

    .form-text {
        font-size: 12px;
        color: #64748b;
        margin-top: 4px;
    }

    .detail-section {
        color: #f8fafc;
    }

    .detail-item {
        margin-bottom: 20px;
    }

    .detail-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
    }

    .detail-item h5 {
        margin: 0 0 8px 0;
        color: #94a3b8;
        font-size: 14px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: 'Inter', sans-serif;
    }

    .detail-item p {
        margin: 0;
        color: #f8fafc;
        font-size: 16px;
        line-height: 1.5;
        font-family: 'Inter', sans-serif;
    }

    .estado-badge, .prioridad-badge {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-family: 'Inter', sans-serif;
    }

    .estado-pendiente {
        background-color: rgba(71, 85, 105, 0.5);
        color: #e2e8f0;
    }

    .estado-progreso {
        background-color: rgba(59, 130, 246, 0.5);
        color: #e2e8f0;
    }

    .estado-revision {
        background-color: rgba(245, 158, 11, 0.5);
        color: #e2e8f0;
    }

    .estado-completado {
        background-color: rgba(34, 197, 94, 0.5);
        color: #e2e8f0;
    }

    .estado-bloqueado {
        background-color: rgba(239, 68, 68, 0.5);
        color: #e2e8f0;
    }

    .prioridad-baja {
        background-color: rgba(34, 197, 94, 0.5);
        color: #e2e8f0;
    }

    .prioridad-media {
        background-color: rgba(245, 158, 11, 0.5);
        color: #e2e8f0;
    }

    .prioridad-alta {
        background-color: rgba(249, 115, 22, 0.5);
        color: #e2e8f0;
    }

    .prioridad-critica {
        background-color: rgba(239, 68, 68, 0.5);
        color: #e2e8f0;
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

    .btn-danger {
        background-color: #ef4444;
        color: white;
    }

    .btn-danger:hover:not(:disabled) {
        background-color: #dc2626;
    }

    .btn-info {
        background-color: #0ea5e9;
        color: white;
    }

    .btn-info:hover:not(:disabled) {
        background-color: #0284c7;
    }

    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            margin: 20px;
        }

        .form-row, .detail-row {
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