<script lang="ts">
  import { onMount } from 'svelte';
  import api from '../lib/api';

  export let projectId: number;
  export let onClose: () => void;
  export let onSuccess: () => void;

  const STATUS_OPTIONS = ["Active", "Inactive", "Completed", "On Hold"];

  let name = "";
  let description = "";
  let status = "Active";
  let startDate = "";
  let endDate = "";
  let loading = true;
  let saving = false;
  let error: string | null = null;

  onMount(async () => {
    try {
      const res = await api.get(`/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      const data = res.data;
      name = data.name || "";
      description = data.description || "";
      status = data.status || "Active";
      
      if (data.startDate) {
        startDate = new Date(data.startDate).toISOString().split('T')[0];
      }
      
      if (data.endDate) {
        endDate = new Date(data.endDate).toISOString().split('T')[0];
      }
    } catch (err) {
      console.error("Error cargando proyecto:", err);
      error = "No se pudo cargar la información del proyecto";
    } finally {
      loading = false;
    }
  });

  function handleEndDateChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const newEndDate = target.value;
    
    if (startDate && newEndDate && new Date(newEndDate) < new Date(startDate)) {
      error = "La fecha de fin no puede ser anterior a la fecha de inicio";
    } else {
      error = null;
    }
    
    endDate = newEndDate;
  }

  function handleStartDateChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const newStartDate = target.value;
    
    if (endDate && newStartDate && new Date(newStartDate) > new Date(endDate)) {
      error = "La fecha de inicio no puede ser posterior a la fecha de fin";
    } else {
      error = null;
    }
    
    startDate = newStartDate;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    saving = true;
    error = null;

    try {
      const updatedData = {
        name,
        description,
        status,
        startDate: startDate || null,
        endDate: endDate || null
      };

      await api.patch(`/projects/${projectId}`, updatedData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      error = err.response?.data?.message || 
        "Ocurrió un error al actualizar el proyecto. Por favor, intenta de nuevo.";
    } finally {
      saving = false;
    }
  }
</script>

<div class="modal-overlay" on:click={onClose}>
  <div class="modal-container" on:click|stopPropagation>
    {#if loading}
      <div class="modal-loading">
        <div class="loader"></div>
        <p>Cargando información del proyecto...</p>
      </div>
    {:else}
      <div class="modal-header">
        <h2>Editar Proyecto</h2>
        <button class="modal-close-btn" on:click={onClose}>×</button>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="edit-project-form">
        {#if error}
          <div class="error-message">{error}</div>
        {/if}

        <div class="form-group">
          <label for="name">Nombre del Proyecto*</label>
          <input
            type="text"
            id="name"
            bind:value={name}
            required
            placeholder="Nombre del proyecto"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label for="description">Descripción</label>
          <textarea
            id="description"
            bind:value={description}
            placeholder="Describe tu proyecto"
            class="form-control"
            rows="3"
          />
        </div>

        <div class="form-group">
          <label for="status">Estado</label>
          <select
            id="status"
            bind:value={status}
            class="form-control"
          >
            {#each STATUS_OPTIONS as option}
              <option value={option}>
                {option}
              </option>
            {/each}
          </select>
        </div>

        <div class="form-row">
          <div class="form-group half">
            <label for="startDate">Fecha de Inicio</label>
            <input
              type="date"
              id="startDate"
              bind:value={startDate}
              on:change={handleStartDateChange}
              class="form-control"
            />
          </div>

          <div class="form-group half">
            <label for="endDate">Fecha de Finalización</label>
            <input
              type="date"
              id="endDate"
              bind:value={endDate}
              on:change={handleEndDateChange}
              class="form-control"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn-cancel"
            on:click={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-save"
            disabled={saving || !!error}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-container {
    background: #1a1a1a;
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    position: relative;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(156, 39, 176, 0.2);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(156, 39, 176, 0.2);
  }

  .modal-close-btn {
    background: none;
    border: none;
    color: #9c27b0;
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.3s ease;
  }

  .modal-close-btn:hover {
    color: #4a148c;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #b0b0b0;
  }

  .form-control {
    width: 100%;
    padding: 0.75rem;
    background: #252525;
    border: 1px solid #333;
    border-radius: 8px;
    color: #fff;
    transition: all 0.3s ease;
  }

  .form-control:focus {
    border-color: #9c27b0;
    box-shadow: 0 0 0 2px rgba(156, 39, 176, 0.2);
    outline: none;
  }

  select.form-control {
    cursor: pointer;
  }

  textarea.form-control {
    resize: vertical;
    min-height: 100px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  .btn-cancel, .btn-save {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-cancel {
    background: transparent;
    color: #9c27b0;
    border: 1px solid #9c27b0;
  }

  .btn-cancel:hover:not(:disabled) {
    background: rgba(156, 39, 176, 0.1);
  }

  .btn-save {
    background: #9c27b0;
    color: white;
    border: none;
  }

  .btn-save:hover:not(:disabled) {
    background: #7b1fa2;
  }

  .btn-save:disabled, .btn-cancel:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .error-message {
    background: rgba(244, 67, 54, 0.1);
    color: #f44336;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .modal-loading {
    text-align: center;
    padding: 2rem;
  }

  .loader {
    border: 3px solid #333;
    border-top: 3px solid #9c27b0;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  input[type="date"] {
    color-scheme: dark;
  }

  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }
</style>