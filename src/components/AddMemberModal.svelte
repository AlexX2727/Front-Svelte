<script lang="ts">
  import { onMount } from 'svelte';
  import api from '../lib/api';

  export let projectId: number;
  export let onClose: () => void;
  export let onSuccess: () => void;

  const roles = [
    { label: "Miembro", value: "Member" },
    { label: "Líder", value: "Leader" },
    { label: "Colaborador", value: "Collaborator" },
    { label: "Observador", value: "Observer" },
    { label: "Gerente de Proyecto", value: "ProjectManager" },
  ];

  let userIdentifier = "";
  let role = "Member";
  let loading = false;
  let error = "";
  let success = "";

  // Evitar que los clics dentro del modal se propaguen al overlay
  function handleModalClick(e: MouseEvent) {
    e.stopPropagation();
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!userIdentifier.trim()) {
      error = "Debes ingresar un correo electrónico o nombre de usuario.";
      return;
    }

    loading = true;
    error = "";
    success = "";

    try {
      await api.post(
        "/project-members",
        {
          project_id: projectId,
          user_identifier: userIdentifier.trim(),
          role,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      success = "Miembro agregado exitosamente 🎉";
      userIdentifier = "";
      role = "Member";

      // Notificar al componente padre sobre el éxito
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      error = err.response?.data?.message || "Error al agregar miembro";
    } finally {
      loading = false;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<div 
  class="modal-overlay" 
  on:click={onClose} 
  on:keydown={handleKeyDown}
  role="dialog"
  aria-labelledby="modal-title"
>
  <div 
    class="modal-content" 
    on:click|stopPropagation 
    role="document"
  >
    <button class="close-button" on:click={onClose}>×</button>
    <h2 id="modal-title">Añadir Miembro al Proyecto</h2>

    <form on:submit={handleSubmit}>
      <div class="form-group">
        <label for="userIdentifier">Correo electrónico o nombre de usuario:</label>
        <input
          id="userIdentifier"
          type="text"
          bind:value={userIdentifier}
          placeholder="ej. juan@email.com o juan123"
        />
      </div>

      <div class="form-group">
        <label for="role">Rol:</label>
        <select
          id="role"
          bind:value={role}
        >
          {#each roles as r}
            <option value={r.value}>
              {r.label}
            </option>
          {/each}
        </select>
      </div>

      {#if error}
        <div class="error-message" role="alert">{error}</div>
      {/if}

      {#if success}
        <div class="success-message" role="status">
          <span>✓</span> {success}
        </div>
      {/if}

      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary"
          on:click={onClose}
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          class="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Añadiendo..." : "Añadir Miembro"}
        </button>
      </div>
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
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background-color: #1a1a1a;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    position: relative;
    border: 1px solid #4a148c;
    box-shadow: 0 0 20px rgba(74, 20, 140, 0.2);
  }

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #9c27b0;
    cursor: pointer;
    transition: color 0.3s ease;
  }

  .close-button:hover {
    color: #7b1fa2;
  }

  h2 {
    margin: 0 0 1.5rem;
    color: #fff;
    font-size: 1.5rem;
    border-bottom: 2px solid #4a148c;
    padding-bottom: 0.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #e1bee7;
  }

  input, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #4a148c;
    border-radius: 6px;
    background-color: #2d2d2d;
    color: #fff;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }

  input:focus, select:focus {
    border-color: #9c27b0;
    outline: none;
    box-shadow: 0 0 0 2px rgba(156, 39, 176, 0.2);
  }

  select {
    cursor: pointer;
  }

  .error-message {
    color: #ff5252;
    margin: 1rem 0;
    padding: 0.75rem;
    border-radius: 4px;
    background-color: rgba(255, 82, 82, 0.1);
    border: 1px solid rgba(255, 82, 82, 0.3);
  }

  .success-message {
    color: #69f0ae;
    margin: 1rem 0;
    padding: 0.75rem;
    border-radius: 4px;
    background-color: rgba(105, 240, 174, 0.1);
    border: 1px solid rgba(105, 240, 174, 0.3);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-primary {
    background-color: #9c27b0;
    color: white;
    border: none;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #7b1fa2;
  }

  .btn-primary:disabled {
    background-color: #4a148c;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .btn-secondary {
    background-color: transparent;
    color: #9c27b0;
    border: 1px solid #9c27b0;
  }

  .btn-secondary:hover {
    background-color: rgba(156, 39, 176, 0.1);
  }
</style>