<script lang="ts">
  import { onMount } from 'svelte';
  import Login from './components/Login.svelte';
  import Principal from './components/Principal.svelte';
  
  let currentRoute = '/login';
  
  onMount(() => {
    // Solo cambia a principal si hay un token
    const token = localStorage.getItem('token');
    if (token) {
      currentRoute = '/principal';
    }
    
    console.log("Ruta actual:", currentRoute);
  });
  
  function navigateTo(route: string) {
    console.log("Navegando a:", route);
    currentRoute = route;
  }
</script>

<main>
  {#if currentRoute === '/login'}
    <Login onNavigate={navigateTo} />
  {:else if currentRoute === '/principal'}
    <Principal onNavigate={navigateTo} />
  {:else}
    <p>Ruta no encontrada: {currentRoute}</p>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
</style>