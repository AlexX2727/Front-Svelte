<script lang="ts">
    import { onMount } from 'svelte';
    import api from '../lib/api';

    // Props
    export let onTaskClick: (taskId: number) => void;

    // Interfaces
    interface Task {
        id: number;
        title: string;
        description: string;
        status: string;
        priority: string;
        project: {
            id: number;
            name: string;
        };
        assignee?: {
            id: number;
            fullName: string;
        };
        dueDate?: string;
    }

    interface Project {
        id: number;
        name: string;
    }

    // Estados
    let tasks: Task[] = [];
    let projects: Project[] = [];
    let loading = true;
    let error: string | null = null;

    // Filtros
    let selectedProject: number | null = null;
    let selectedStatus: string | null = null;
    let searchTerm = '';

    // Modificar la función loadData para cargar tareas por proyecto
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

            // Cargar todas las tareas de los proyectos
            const tasksResponse = await api.get('/tasks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            tasks = tasksResponse.data;
        } catch (err) {
            console.error('Error cargando datos:', err);
            error = 'Error al cargar las tareas';
        } finally {
            loading = false;
        }
    }

    // Filtrar tareas
    $: filteredTasks = tasks.filter(task => {
        const matchesProject = !selectedProject || task.project.id === selectedProject;
        const matchesStatus = !selectedStatus || task.status === selectedStatus;
        const matchesSearch = !searchTerm || 
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesProject && matchesStatus && matchesSearch;
    });

    onMount(() => {
        loadData();
    });
</script>

<div class="tareas-container">
    <div class="filtros">
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
                <div class="tarea-card" on:click={() => onTaskClick(task.id)}>
                    <div class="tarea-header">
                        <h3>{task.title}</h3>
                        <span class={`priority-badge ${task.priority.toLowerCase()}`}>
                            {task.priority}
                        </span>
                    </div>
                    
                    <p class="tarea-description">{task.description || 'Sin descripción'}</p>
                    
                    <div class="tarea-meta">
                        <span class="proyecto-badge">
                            📁 {task.project.name}
                        </span>
                        <span class={`status-badge ${task.status.toLowerCase()}`}>
                            {task.status}
                        </span>
                    </div>
                    
                    <div class="tarea-footer">
                        {#if task.assignee}
                            <div class="assignee">
                                👤 {task.assignee.fullName}
                            </div>
                        {/if}
                        {#if task.dueDate}
                            <div class="due-date">
                                📅 {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .tareas-container {
        padding: 24px;
        background-color: #1a1a1a;
        border-radius: 12px;
        min-height: 80vh;
    }

    .filtros {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        background: #242424;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .search-input, .filter-select {
        padding: 10px 16px;
        border: 1px solid #363636;
        border-radius: 6px;
        background-color: #2a2a2a;
        color: #ffffff;
        font-size: 14px;
        transition: all 0.3s ease;
    }

    .search-input:focus, .filter-select:focus {
        border-color: #3498db;
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        outline: none;
    }

    .search-input::placeholder {
        color: #666;
    }

    .tareas-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
        padding: 8px;
    }

    .tarea-card {
        background: linear-gradient(145deg, #242424, #1e1e1e);
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid #333;
        position: relative;
        overflow: hidden;
    }

    .tarea-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        border-color: #3498db;
    }

    .tarea-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
    }

    .tarea-header h3 {
        margin: 0;
        color: #ffffff;
        font-size: 1.2rem;
        font-weight: 600;
        line-height: 1.4;
    }

    .priority-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .priority-badge.high {
        background-color: #ff4757;
        color: white;
    }

    .priority-badge.medium {
        background-color: #ffa502;
        color: #1e1e1e;
    }

    .priority-badge.low {
        background-color: #2ed573;
        color: white;
    }

    .tarea-description {
        color: #a4b0be;
        font-size: 0.95rem;
        line-height: 1.6;
        margin: 12px 0;
        min-height: 48px;
    }

    .tarea-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #333;
    }

    .proyecto-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #70a1ff;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .status-badge {
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 0.85rem;
        font-weight: 500;
        text-transform: capitalize;
    }

    .status-badge.todo {
        background-color: #2f3542;
        color: #dfe4ea;
    }

    .status-badge.in-progress {
        background-color: #70a1ff;
        color: #2f3542;
    }

    .status-badge.review {
        background-color: #ffa502;
        color: #2f3542;
    }

    .status-badge.done {
        background-color: #2ed573;
        color: white;
    }

    .status-badge.blocked {
        background-color: #ff4757;
        color: white;
    }

    .tarea-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
        font-size: 0.9rem;
        color: #a4b0be;
    }

    .assignee, .due-date {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .loading {
        text-align: center;
        padding: 40px;
        color: #a4b0be;
    }

    .spinner {
        display: inline-block;
        width: 40px;
        height: 40px;
        border: 3px solid #3498db;
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
        background: rgba(255, 71, 87, 0.1);
        border-radius: 8px;
        color: #ff4757;
    }

    .no-tasks {
        text-align: center;
        padding: 40px;
        color: #a4b0be;
        background: #242424;
        border-radius: 8px;
        margin-top: 24px;
    }
</style>