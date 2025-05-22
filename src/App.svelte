<script lang="ts">
  import { onMount } from 'svelte';
  import Login from './components/Login.svelte';
  import Principal from './components/Principal.svelte';
  import Perfil from './components/Perfil.svelte';
  import MisProyectos from './components/MisProyectos.svelte';
  import CrearProyecto from './components/CrearProyecto.svelte';
  import EditProjectModal from './components/EditProjectModal.svelte';
  import ListadoTareas from './components/ListadoTareas.svelte';
  // Usa el nuevo modal de detalle de tareas
  import TaskDetailModal from './components/TaskDetailModal.svelte';
  
  let currentRoute = '/login';
  let showPerfilModal = false;
  let showProyectosModal = false;
  let showCrearProyectoModal = false;
  let showTaskDetail = false;
  let showTaskListModal = false; 
  let selectedTaskId: number | null = null;
  
  onMount(() => {
    const token = localStorage.getItem('token');
    if (token) {
      currentRoute = '/principal';
    }
  });
  
  function navigateTo(route: string) {
    console.log("Navegando a:", route);
    if (route === '/perfil') {
      showPerfilModal = true;
    } else if (route === '/proyectos' || route === '/MisProyectos') {
      showProyectosModal = true;
    } else if (route === '/crear-proyecto') {
      showCrearProyectoModal = true;
    } else if (route === '/tareas') {
      showTaskListModal = true;
    } else {
      currentRoute = route;
    }
  }
  
  function handleTaskClick(taskId: number) {
    selectedTaskId = taskId;
    showTaskDetail = true;
    // Cerrar el modal de listado de tareas cuando se abre el detalle
    showTaskListModal = false;
  }
  
  let showEditProjectModal = false;
  let selectedProjectId: number | null = null;

  function handleEditProject(id: number) {
    selectedProjectId = id;
    showEditProjectModal = true;
  }

  function handleCloseTask() {
    showTaskDetail = false;
    selectedTaskId = null;
    // Opcional: volver a mostrar la lista de tareas
    // showTaskListModal = true;
  }

  function handleTaskUpdated() {
    showTaskDetail = false;
    selectedTaskId = null;
    // Opcional: volver a mostrar la lista de tareas actualizada
    // showTaskListModal = true;
  }

  function handleTaskDeleted() {
    showTaskDetail = false;
    selectedTaskId = null;
    // Opcional: volver a mostrar la lista de tareas
    // showTaskListModal = true;
  }
</script>

<main>
  {#if currentRoute === '/login'}
    <Login onNavigate={navigateTo} />
  {:else if currentRoute === '/principal'}
    <Principal onNavigate={navigateTo} />
  {:else}
    <div class="error-page">
      <h2>Ruta no encontrada: {currentRoute}</h2>
      <button on:click={() => navigateTo('/principal')}>Volver al inicio</button>
    </div>
  {/if}
</main>

<!-- Modales globales -->
{#if showPerfilModal}
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-modal" on:click={() => showPerfilModal = false}>×</button>
      <Perfil onNavigate={navigateTo} />
    </div>
  </div>
{/if}

{#if showProyectosModal}
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-modal" on:click={() => showProyectosModal = false}>×</button>
      <MisProyectos 
        onNavigate={navigateTo}
        onEditProject={handleEditProject}
      />
    </div>
  </div>
{/if}

{#if showCrearProyectoModal}
  <CrearProyecto
    onClose={() => showCrearProyectoModal = false}
    onSuccess={() => {
      showCrearProyectoModal = false;
    }}
  />
{/if}

{#if showEditProjectModal && selectedProjectId}
  <EditProjectModal
    projectId={selectedProjectId}
    onClose={() => {
      showEditProjectModal = false;
      selectedProjectId = null;
    }}
    onSuccess={() => {
      showEditProjectModal = false;
      selectedProjectId = null;
      showProyectosModal = false;
      setTimeout(() => showProyectosModal = true, 0);
    }}
  />
{/if}

{#if showTaskListModal}
  <div class="modal-overlay">
    <div class="modal-container">
      <button class="close-modal" on:click={() => showTaskListModal = false}>×</button>
      <ListadoTareas onTaskClick={handleTaskClick} />
    </div>
  </div>
{/if}

<!-- Modal de detalle de tarea -->
{#if showTaskDetail && selectedTaskId}
  <TaskDetailModal
    isOpen={showTaskDetail}
    taskId={selectedTaskId}
    onClose={handleCloseTask}
    onTaskUpdated={handleTaskUpdated}
    onTaskDeleted={handleTaskDeleted}
  />
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #121212;
    color: #ffffff;
  }
  
  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
    padding: 20px;
  }
  
  .error-page button {
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-container {
    position: relative;
    width: 95%;
    max-width: 800px;
    max-height: 85vh;
    overflow-y: auto;
    border-radius: 12px;
    background-color: #121212;
    padding: 20px;
    margin: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .modal-container::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .modal-container::-webkit-scrollbar-track {
    background: #1e1e1e;
    border-radius: 4px;
  }
  
  .modal-container::-webkit-scrollbar-thumb {
    background: #3498db;
    border-radius: 4px;
  }
  
  .close-modal {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    z-index: 1001;
    padding: 5px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.3s ease;
  }
  
  .close-modal:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #3498db;
  }
</style>