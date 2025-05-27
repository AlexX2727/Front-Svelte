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

  .modal-container {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 2rem;
    border-radius: 16px;
    width: 90%;
    max-width: 600px;
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

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  }

  .modal-header h2 {
    color: #f8fafc;
    font-weight: 600;
    font-size: 1.5rem;
    margin: 0;
  }

  .modal-close-btn {
    background: none;
    border: none;
    color: #64748b;
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.3s ease;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
  }

  .modal-close-btn:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
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
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .form-control {
    width: 100%;
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 8px;
    color: #f8fafc;
    transition: all 0.3s ease;
    font-family: 'Inter', sans-serif;
  }

  .form-control:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    outline: none;
  }

  select.form-control {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 16px;
    padding-right: 2.5rem;
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
    font-family: 'Inter', sans-serif;
  }

  .btn-cancel {
    background: transparent;
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .btn-cancel:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.5);
  }

  .btn-save {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
  }

  .btn-save:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }

  .btn-save:disabled, .btn-cancel:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .modal-loading {
    text-align: center;
    padding: 2rem;
    color: #94a3b8;
  }

  .loader {
    border: 3px solid rgba(71, 85, 105, 0.3);
    border-top: 3px solid #3b82f6;
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
    filter: invert(0.8);
    cursor: pointer;
    opacity: 0.6;
  }

  input[type="date"]::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }
</style>