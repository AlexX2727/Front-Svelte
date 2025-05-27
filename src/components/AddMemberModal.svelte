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
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-content {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 2rem;
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    position: relative;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(59, 130, 246, 0.2);
    font-family: 'Inter', sans-serif;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: #64748b;
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
  }

  .close-button:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  h2 {
    margin: 0 0 1.5rem;
    color: #f8fafc;
    font-size: 1.5rem;
    font-weight: 600;
    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
    padding-bottom: 0.75rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 500;
  }

  input, select {
    width: 100%;
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 8px;
    color: #f8fafc;
    transition: all 0.3s ease;
    font-family: 'Inter', sans-serif;
  }

  input:focus, select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    outline: none;
  }

  select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 16px;
    padding-right: 2.5rem;
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
    border: 1px solid rgba(239, 68, 68, 0.2);
    font-size: 0.875rem;
  }

  .success-message {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
    border: 1px solid rgba(16, 185, 129, 0.2);
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .success-message span {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: rgba(16, 185, 129, 0.2);
    border-radius: 50%;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Inter', sans-serif;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
  }

  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }

  .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: transparent;
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .btn-secondary:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.5);
  }
</style>