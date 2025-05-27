<script lang="ts">
    import { onMount } from 'svelte';
    import api from '../lib/api';
    import { TaskService } from '../services/taskService';
    import CreateTaskModal from './CreateTaskModal.svelte';
    import type { Task, Project, TaskFilters, TaskStatus, TaskPriority } from '../lib/types/task';

    // Props
    export let onTaskClick: (taskId: number) => void;

    // Estados
    let tasks: Task[] = [];
    let projects: Project[] = [];
    let loading = true;
    let error: string | null = null;

    // Filtros
    let selectedProject: number | null = null;
    let selectedStatus: TaskStatus | null = null;
    let selectedPriority: TaskPriority | null = null;
    let selectedAssignee: number | null = null;
    let searchTerm = '';
    let showMyTasks = false;
    let showCreateModal = false;

    // Función para cargar datos
    async function loadData() {
        try {
            loading = true;
            error = null;
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            if (!token || !user.id) {
                throw new Error('No hay token de autenticación o usuario');
            }

            // Cargar los proyectos del usuario para el filtro
            const projectsResponse = await api.get(`/projects/owner/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            projects = projectsResponse.data;

            // Preparar filtros para la consulta
            const filters: TaskFilters = {};
            if (selectedProject) filters.projectId = selectedProject;
            if (selectedStatus) filters.status = selectedStatus;
            if (selectedPriority) filters.priority = selectedPriority;
            if (selectedAssignee) filters.assigneeId = selectedAssignee;
            if (showMyTasks) filters.myTasks = true;

            // Cargar tareas usando el servicio con filtros
            if (Object.keys(filters).length > 0) {
                tasks = await TaskService.getTasksWithFilters(filters);
            } else {
                tasks = await TaskService.getAllTasks();
            }
        } catch (err) {
            console.error('Error cargando datos:', err);
            error = 'Error al cargar las tareas';
        } finally {
            loading = false;
        }
    }

    // Filtrar tareas localmente por término de búsqueda
    $: filteredTasks = tasks.filter(task => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
            task.title.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower) ||
            task.project?.name?.toLowerCase().includes(searchLower) ||
            task.assignee?.firstName?.toLowerCase().includes(searchLower) ||
            task.assignee?.lastName?.toLowerCase().includes(searchLower) ||
            task.assignee?.username?.toLowerCase().includes(searchLower)
        );
    });

    // Función para manejar clic en tarea
    function handleTaskClick(taskId: number) {
        onTaskClick(taskId);
    }

    // Función para manejar creación exitosa de tarea
    function handleTaskCreated() {
        showCreateModal = false;
        loadData(); // Recargar la lista de tareas
    }

    // Recargar datos cuando cambien los filtros
    $: if (selectedProject !== null || selectedStatus !== null || selectedPriority !== null || selectedAssignee !== null || showMyTasks) {
        loadData();
    }

    // Función para limpiar filtros
    function clearFilters() {
        selectedProject = null;
        selectedStatus = null;
        selectedPriority = null;
        selectedAssignee = null;
        showMyTasks = false;
        searchTerm = '';
        loadData();
    }

    // Función para obtener el nombre completo del asignado
    function getAssigneeName(task: Task): string {
        if (!task.assignee) return 'Sin asignar';
        
        const { firstName, lastName, username } = task.assignee;
        if (firstName && lastName) {
            return `${firstName} ${lastName}`;
        }
        return username || `Usuario #${task.assignee.id}`;
    }

    // Función para formatear fecha
    function formatDate(dateString: string | undefined): string {
        if (!dateString) return 'No definida';
        try {
            return new Date(dateString).toLocaleDateString('es-ES');
        } catch {
            return 'Fecha inválida';
        }
    }

    // Función para obtener texto de estado en español
    function getStatusText(status: string): string {
        const statusMap: Record<string, string> = {
            'Todo': 'Por Hacer',
            'In Progress': 'En Progreso',
            'Review': 'En Revisión',
            'Done': 'Completado',
            'Blocked': 'Bloqueado'
        };
        return statusMap[status] || status;
    }

    // Función para obtener texto de prioridad en español
    function getPriorityText(priority: string): string {
        const priorityMap: Record<string, string> = {
            'Low': 'Baja',
            'Medium': 'Media',
            'High': 'Alta',
            'Critical': 'Crítica'
        };
        return priorityMap[priority] || priority;
    }

    onMount(() => {
        loadData();
    });
</script>

<div class="tareas-container">
    <!-- Header con título y botón de crear -->
    <div class="header-section">
        <div class="header-content">
            <h1 class="page-title">📋 Gestión de Tareas</h1>
            <button 
                class="create-btn"
                on:click={() => showCreateModal = true}
                disabled={loading}
            >
                <span class="btn-icon">+</span>
                Nueva Tarea
            </button>
        </div>
    </div>

    <div class="filtros">
        <div class="filtros-row">
            <input 
                type="text" 
                placeholder="Buscar tareas..." 
                bind:value={searchTerm}
                class="search-input"
            />

            <select 
                bind:value={selectedProject}
                class="filter-select"
            >
                <option value={null}>Todos los proyectos</option>
                {#each projects as project}
                    <option value={project.id}>{project.name}</option>
                {/each}
            </select>

            <select 
                bind:value={selectedStatus}
                class="filter-select"
            >
                <option value={null}>Todos los estados</option>
                <option value="Todo">Por Hacer</option>
                <option value="In Progress">En Progreso</option>
                <option value="Review">En Revisión</option>
                <option value="Done">Completado</option>
                <option value="Blocked">Bloqueado</option>
            </select>

            <select 
                bind:value={selectedPriority}
                class="filter-select"
            >
                <option value={null}>Todas las prioridades</option>
                <option value="Low">Baja</option>
                <option value="Medium">Media</option>
                <option value="High">Alta</option>
                <option value="Critical">Crítica</option>
            </select>
        </div>

        <div class="filtros-row">
            <label class="checkbox-label">
                <input 
                    type="checkbox" 
                    bind:checked={showMyTasks}
                    class="checkbox-input"
                />
                <span class="checkbox-text">Solo mis tareas</span>
            </label>

            <button 
                class="clear-filters-btn"
                on:click={clearFilters}
                disabled={loading}
            >
                Limpiar filtros
            </button>

            <button 
                class="refresh-btn"
                on:click={loadData}
                disabled={loading}
            >
                🔄 Actualizar
            </button>
        </div>
    </div>

    {#if loading}
        <div class="loading">
            <span class="spinner"></span>
            <p>Cargando tareas...</p>
        </div>
    {:else if error}
        <div class="error-message">
            <p>{error}</p>
            <button on:click={loadData}>Reintentar</button>
        </div>
    {:else if filteredTasks.length === 0}
        <div class="no-tasks">
            <p>No se encontraron tareas que coincidan con los filtros</p>
        </div>
    {:else}
        <div class="tareas-grid">
            {#each filteredTasks as task}
                <div class="tarea-card" on:click={() => handleTaskClick(task.id)}>
                    <div class="tarea-header">
                        <h3>{task.title}</h3>
                        <span class={`priority-badge ${task.priority.toLowerCase()}`}>
                            {getPriorityText(task.priority)}
                        </span>
                    </div>
                    
                    <p class="tarea-description">{task.description || 'Sin descripción'}</p>
                    
                    <div class="tarea-meta">
                        <span class="proyecto-badge">
                            📁 {task.project?.name || 'Sin proyecto'}
                        </span>
                        <span class={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                            {getStatusText(task.status)}
                        </span>
                    </div>
                    
                    <div class="tarea-footer">
                        <div class="assignee">
                            👤 {getAssigneeName(task)}
                        </div>
                        {#if task.dueDate}
                            <div class="due-date">
                                📅 {formatDate(task.dueDate)}
                            </div>
                        {/if}
                    </div>

                    {#if task._count && (task._count.comments > 0 || task._count.attachments > 0)}
                        <div class="task-counts">
                            {#if task._count.comments > 0}
                                <span class="count-badge">💬 {task._count.comments}</span>
                            {/if}
                            {#if task._count.attachments > 0}
                                <span class="count-badge">📎 {task._count.attachments}</span>
                            {/if}
                        </div>
                    {/if}

                    {#if task.estimatedHours}
                        <div class="hours-info">
                            <span class="hours-badge">⏱️ {task.estimatedHours}h estimadas</span>
                            {#if task.actualHours}
                                <span class="hours-badge">⏰ {task.actualHours}h reales</span>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Modal de crear tarea -->
<CreateTaskModal
    bind:isOpen={showCreateModal}
    onClose={() => showCreateModal = false}
    onTaskCreated={handleTaskCreated}
/>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    .tareas-container {
        padding: 24px;
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        min-height: 80vh;
        border: 1px solid rgba(71, 85, 105, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .header-section {
        margin-bottom: 24px;
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8));
        padding: 20px 24px;
        border-radius: 16px;
        border: 1px solid rgba(71, 85, 105, 0.2);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .page-title {
        margin: 0;
        color: #f8fafc;
        font-size: 1.5rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .create-btn {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .create-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #2563eb, #1e40af);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }

    .create-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .btn-icon {
        font-size: 18px;
        font-weight: bold;
        line-height: 1;
    }

    .filtros {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 24px;
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.7));
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(71, 85, 105, 0.2);
    }

    .filtros-row {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
    }

    .search-input, .filter-select {
        padding: 12px 16px;
        border: 1px solid rgba(71, 85, 105, 0.3);
        border-radius: 12px;
        background-color: rgba(30, 41, 59, 0.6);
        color: #f8fafc;
        font-size: 14px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        min-width: 200px;
        backdrop-filter: blur(5px);
    }

    .search-input:focus, .filter-select:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        outline: none;
    }

    .search-input::placeholder {
        color: #94a3b8;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #f8fafc;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .checkbox-label:hover {
        background: rgba(59, 130, 246, 0.1);
    }

    .checkbox-input {
        width: 18px;
        height: 18px;
        accent-color: #3b82f6;
    }

    .checkbox-text {
        font-size: 14px;
        font-weight: 500;
    }

    .clear-filters-btn, .refresh-btn {
        padding: 10px 16px;
        border: 1px solid rgba(71, 85, 105, 0.3);
        border-radius: 12px;
        background-color: rgba(30, 41, 59, 0.6);
        color: #f8fafc;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(5px);
    }

    .clear-filters-btn:hover, .refresh-btn:hover {
        background-color: rgba(59, 130, 246, 0.2);
        border-color: #3b82f6;
        transform: translateY(-2px);
    }

    .clear-filters-btn:disabled, .refresh-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }

    .tareas-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
        padding: 8px;
    }

    .tarea-card {
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.7));
        border-radius: 16px;
        padding: 24px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid rgba(71, 85, 105, 0.2);
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .tarea-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .tarea-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        border-color: rgba(59, 130, 246, 0.4);
    }

    .tarea-card:hover::before {
        opacity: 1;
    }

    .tarea-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
    }

    .tarea-header h3 {
        margin: 0;
        color: #f8fafc;
        font-size: 1.2rem;
        font-weight: 600;
        line-height: 1.4;
        flex: 1;
        margin-right: 12px;
    }

    .priority-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .priority-badge.critical {
        background: linear-gradient(135deg, #ef4444, #b91c1c);
        color: white;
    }

    .priority-badge.high {
        background: linear-gradient(135deg, #f97316, #c2410c);
        color: white;
    }

    .priority-badge.medium {
        background: linear-gradient(135deg, #f59e0b, #b45309);
        color: white;
    }

    .priority-badge.low {
        background: linear-gradient(135deg, #10b981, #047857);
        color: white;
    }

    .tarea-description {
        color: #cbd5e1;
        font-size: 0.95rem;
        line-height: 1.6;
        margin: 12px 0;
        min-height: 48px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .tarea-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid rgba(71, 85, 105, 0.2);
    }

    .proyecto-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #60a5fa;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .status-badge {
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: capitalize;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .status-badge.todo {
        background: linear-gradient(135deg, #475569, #334155);
        color: #f8fafc;
    }

    .status-badge.in-progress {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
    }

    .status-badge.review {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
    }

    .status-badge.done {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
    }

    .status-badge.blocked {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
    }

    .tarea-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
        font-size: 0.9rem;
        color: #cbd5e1;
    }

    .assignee, .due-date {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        background: rgba(30, 41, 59, 0.4);
        border-radius: 8px;
        backdrop-filter: blur(5px);
    }

    .task-counts {
        display: flex;
        gap: 8px;
        margin-top: 12px;
    }

    .count-badge {
        padding: 4px 10px;
        background: rgba(30, 41, 59, 0.4);
        border-radius: 12px;
        font-size: 0.8rem;
        color: #cbd5e1;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(71, 85, 105, 0.2);
    }

    .hours-info {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;
    }

    .hours-badge {
        padding: 4px 10px;
        background: rgba(59, 130, 246, 0.15);
        border-radius: 12px;
        font-size: 0.8rem;
        color: #60a5fa;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .loading {
        text-align: center;
        padding: 40px;
        color: #cbd5e1;
    }

    .spinner {
        display: inline-block;
        width: 40px;
        height: 40px;
        border: 3px solid #3b82f6;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .error-message {
        text-align: center;
        padding: 24px;
        background: rgba(239, 68, 68, 0.1);
        border-radius: 16px;
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.2);
        backdrop-filter: blur(5px);
    }

    .no-tasks {
        text-align: center;
        padding: 40px;
        color: #cbd5e1;
        background: rgba(30, 41, 59, 0.4);
        border-radius: 16px;
        margin-top: 24px;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(71, 85, 105, 0.2);
    }

    @media (max-width: 768px) {
        .header-content {
            flex-direction: column;
            gap: 16px;
            text-align: center;
        }

        .page-title {
            font-size: 1.25rem;
        }

        .create-btn {
            width: 100%;
            justify-content: center;
        }

        .filtros-row {
            flex-direction: column;
            align-items: stretch;
        }

        .search-input, .filter-select {
            min-width: 100%;
        }

        .tareas-grid {
            grid-template-columns: 1fr;
        }
    }
</style>