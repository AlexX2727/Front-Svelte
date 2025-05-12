<script lang="ts">
  import { onMount } from 'svelte';
  import api from '../lib/api';
  import AddMemberModal from './AddMemberModal.svelte';
  
  export let onNavigate: (route: string) => void;
  
  interface Proyecto {
    id: number;
    name: string;
    description: string;
    status: string;
    startDate?: string;
    endDate?: string;
    _count: {
      members: number;
      tasks: number;
    };
  }
  
  let proyectos: Proyecto[] = [];
  let loading = true;
  let hoverIndex: number | null = null;
  let showModal = false;
  let selectedProjectId: number | null = null;
  
  const user = JSON.parse(localStorage.getItem("user") || "null");
  
  async function fetchProyectos() {
    try {
      const res = await api.get(`/projects/owner/${user.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      proyectos = res.data;
    } catch (error) {
      console.error("Error cargando proyectos:", error);
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    if (user) {
      fetchProyectos();
    }
  });
  
  function handleCreateProject() {
    onNavigate("/crear-proyecto");
  }
  
  function handleEditClick(id: number) {
    console.log(`Editar proyecto con ID: ${id}`);
    // Aquí puedes implementar la lógica para editar el proyecto
  }
  
  function handleAddMembersClick(id: number) {
    selectedProjectId = id;
    showModal = true;
  }
  
  function handleCloseModal() {
    showModal = false;
    selectedProjectId = null;
  }
  
  function handleMemberAdded() {
    // Refrescar los datos del proyecto después de añadir un miembro
    fetchProyectos();
  }
  
  function formatDate(dateString?: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }
  
  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case "completado":
        return "var(--status-completed)";
      case "en progreso":
      case "active":
        return "var(--status-progress)";
      case "pendiente":
        return "var(--status-pending)";
      default:
        return "var(--status-default)";
    }
  }
</script>

{#if loading}
  <div class="loading-container">
    <div class="loader"></div>
    <p>Cargando proyectos...</p>
  </div>
{:else}
  <div class="proyectos-container">
    <header class="proyectos-header">
      <h1 class="proyectos-title">Mis Proyectos</h1>
      <button class="btn-crear-proyecto" on:click={handleCreateProject}>
        <span class="btn-icon">+</span> Crear nuevo proyecto
      </button>
    </header>

    {#if proyectos.length === 0}
      <div class="no-proyectos">
        <div class="empty-state-icon">📂</div>
        <h3>No tienes proyectos aún</h3>
        <p>Crea tu primer proyecto para empezar a gestionar tus tareas</p>
        <button class="btn-crear-proyecto" on:click={handleCreateProject}>
          Crear proyecto
        </button>
      </div>
    {:else}
      <div class="proyectos-grid">
        {#each proyectos as proyecto, index}
          <div
            class="proyecto-card {hoverIndex === index ? 'hover' : ''}"
            on:mouseenter={() => (hoverIndex = index)}
            on:mouseleave={() => (hoverIndex = null)}
          >
            <div 
              class="proyecto-status-indicator" 
              style="background-color: {getStatusColor(proyecto.status)}"
            ></div>
            
            <div class="proyecto-header">
              <h3 class="proyecto-title">{proyecto.name}</h3>
            </div>
            
            <div class="proyecto-description">
              <p>{proyecto.description}</p>
            </div>
            
            <div class="proyecto-status">
              <span 
                class="status-badge" 
                style="background-color: {getStatusColor(proyecto.status)}"
              >
                {proyecto.status}
              </span>
            </div>
            
            <div class="proyecto-stats">
              <div class="stat-item">
                <span class="stat-icon">👥</span>
                <span class="stat-value">{proyecto._count.members}</span>
                <span class="stat-label">Miembros</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">✓</span>
                <span class="stat-value">{proyecto._count.tasks}</span>
                <span class="stat-label">Tareas</span>
              </div>
            </div>
            
            <div class="proyecto-dates">
              {#if proyecto.startDate}
                <div class="date-item">
                  <span class="date-label">Inicio:</span>
                  <span class="date-value">{formatDate(proyecto.startDate)}</span>
                </div>
              {/if}
              {#if proyecto.endDate}
                <div class="date-item">
                  <span class="date-label">Fin:</span>
                  <span class="date-value">{formatDate(proyecto.endDate)}</span>
                </div>
              {/if}
            </div>

            <div class="proyecto-actions">
              <button 
                class="action-button edit"
                on:click={() => handleEditClick(proyecto.id)}
              >
                ✏️ Editar
              </button>
              <button 
                class="action-button members"
                on:click={() => handleAddMembersClick(proyecto.id)}
              >
                👥 Añadir Miembros
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

{#if showModal && selectedProjectId}
  <AddMemberModal
    projectId={selectedProjectId}
    onClose={handleCloseModal}
    onSuccess={handleMemberAdded}
  />
{/if}

<style>
  .proyectos-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .proyectos-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .proyectos-title {
    font-size: 2rem;
    color: var(--text-primary);
    margin: 0;
  }

  .btn-crear-proyecto {
    background: linear-gradient(135deg, var(--accent-color), #2980b9);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .btn-crear-proyecto:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .btn-icon {
    font-size: 1.2rem;
  }

  .proyectos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
  }

  .proyecto-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 1.5rem;
    position: relative;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .proyecto-card.hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  .proyecto-status-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    border-radius: 12px 0 0 12px;
  }

  .proyecto-header {
    margin-bottom: 1rem;
  }

  .proyecto-title {
    margin: 0;
    font-size: 1.25rem;
    color: var(--text-primary);
  }

  .proyecto-description {
    color: var(--text-secondary);
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    color: white;
  }

  .proyecto-stats {
    display: flex;
    gap: 1.5rem;
    margin: 1rem 0;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stat-icon {
    font-size: 1.2rem;
  }

  .stat-value {
    font-weight: bold;
    color: var(--text-primary);
  }

  .stat-label {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  .proyecto-dates {
    margin-top: 1rem;
    font-size: 0.9rem;
  }

  .date-item {
    display: flex;
    gap: 0.5rem;
    color: var(--text-secondary);
  }

  .date-label {
    font-weight: 500;
  }

  .proyecto-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .action-button {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
  }

  .action-button.edit {
    background-color: var(--accent-color);
    color: white;
  }

  .action-button.members {
    background-color: #2ecc71;
    color: white;
  }

  .action-button:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  .loader {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    border-top-color: var(--accent-color);
    animation: spin 1s linear infinite;
  }

  .no-proyectos {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
  }

  .empty-state-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .proyectos-container {
      padding: 1rem;
    }

    .proyectos-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .proyectos-grid {
      grid-template-columns: 1fr;
    }
  }
</style>