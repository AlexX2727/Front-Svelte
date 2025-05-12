<script lang="ts">
  import { onMount } from 'svelte';
  import Login from './components/Login.svelte';
  import Principal from './components/Principal.svelte';
  import Perfil from './components/Perfil.svelte';
  import MisProyectos from './components/MisProyectos.svelte';
  
  let currentRoute = '/login';
  let showPerfilModal = false;
  
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
    } else {
      currentRoute = route;
    }
  }
</script>

<main>
  {#if currentRoute === '/login'}
    <Login onNavigate={navigateTo} />
  {:else if currentRoute === '/principal'}
    <Principal onNavigate={navigateTo} />
    {#if showPerfilModal}
      <div class="modal-overlay">
        <div class="modal-container">
          <button class="close-modal" on:click={() => showPerfilModal = false}>×</button>
          <Perfil onNavigate={navigateTo} />
        </div>
      </div>
    {/if}
  {:else if currentRoute === '/proyectos' || currentRoute === '/MisProyectos'}
    <MisProyectos onNavigate={navigateTo} />
  {:else}
    <div class="error-page">
      <h2>Ruta no encontrada: {currentRoute}</h2>
      <button on:click={() => navigateTo('/principal')}>Volver al inicio</button>
    </div>
  {/if}
</main>

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