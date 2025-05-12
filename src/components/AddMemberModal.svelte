<script lang="ts">
  import { onMount } from 'svelte';
  import api from '../lib/api';

  export let projectId: number;
  export let onClose: () => void;
  export let onMemberAdded: () => void;

  let email = "";
  let loading = false;
  let error = "";
  let success = "";

  async function handleSubmit(e: Event) {
    e.preventDefault();
    loading = true;
    error = "";
    success = "";

    try {
      await api.post(`/projects/${projectId}/members`, { email });
      success = "Miembro añadido exitosamente";
      onMemberAdded();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      error = "No se pudo añadir el miembro. Verifica el correo electrónico.";
    } finally {
      loading = false;
    }
  }
</script>

<div class="modal-overlay">
  <div class="modal-content">
    <button class="close-button" on:click={onClose}>×</button>
    <h2>Añadir Miembro al Proyecto</h2>

    <form on:submit={handleSubmit}>
      <div class="form-group">
        <label for="email">Correo Electrónico</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          placeholder="Ingresa el correo del nuevo miembro"
          required
        />
      </div>

      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      {#if success}
        <div class="success-message">{success}</div>
      {/if}

      <button type="submit" class="submit-button" disabled={loading}>
        {#if loading}
          Añadiendo...
        {:else}
          Añadir Miembro
        {/if}
      </button>
    </form>
  </div>
</div>

<style>
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

  .modal-content {
    background-color: #1e1e1e;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    position: relative;
    border: 1px solid #333;
  }

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #666;
    cursor: pointer;
  }

  .close-button:hover {
    color: #fff;
  }

  h2 {
    margin: 0 0 1.5rem;
    color: #fff;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #b0b0b0;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #333;
    border-radius: 6px;
    background-color: #252525;
    color: #fff;
  }

  input:focus {
    border-color: #3498db;
    outline: none;
  }

  .error-message {
    color: #e74c3c;
    margin: 1rem 0;
    padding: 0.5rem;
    border-radius: 4px;
    background-color: rgba(231, 76, 60, 0.1);
  }

  .success-message {
    color: #2ecc71;
    margin: 1rem 0;
    padding: 0.5rem;
    border-radius: 4px;
    background-color: rgba(46, 204, 113, 0.1);
  }

  .submit-button {
    width: 100%;
    padding: 0.75rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
  }

  .submit-button:disabled {
    background-color: #2980b9;
    cursor: not-allowed;
  }

  .submit-button:hover:not(:disabled) {
    background-color: #2980b9;
  }
</style>