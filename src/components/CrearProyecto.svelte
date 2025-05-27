<script lang="ts">
  import { onMount } from 'svelte';
  import api from '../lib/api';

  export let onClose: () => void;
  export let onSuccess: () => void;

  let form = {
    name: "",
    description: "",
    startDate: "",
    endDate: ""
  };

  let error = "";
  let loading = false;
  let success = false;
  let activeField = "";
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  function handleFocus(fieldName: string) {
    activeField = fieldName;
  }

  function handleBlur() {
    activeField = "";
  }

  function handleChange(e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    form = { ...form, [target.name]: target.value };
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = "";
    loading = true;

    try {
      await api.post(
        "/projects",
        {
          ...form,
          owner_id: user.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      success = true;
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      error = err.response?.data?.message || "Error al crear el proyecto";
      const formElement = document.querySelector('.form-wrapper');
      formElement?.classList.add('shake-animation');
      setTimeout(() => {
        formElement?.classList.remove('shake-animation');
      }, 500);
    } finally {
      loading = false;
    }
  }
</script>
<div class="proyecto-page" role="dialog" aria-labelledby="modal-title">
  <div class="animated-bg">
    <div class="animated-shape shape1"></div>
    <div class="animated-shape shape2"></div>
    <div class="animated-shape shape3"></div>
    <div class="animated-shape shape4"></div>
  </div>

  <div class="form-wrapper">
    <div class="form-header">
      <div class="form-title-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 8V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 id="modal-title">Crear Nuevo Proyecto</h1>
      <button class="close-button" on:click={onClose}>×</button>
    </div>

    {#if success}
      <div class="success-container">
        <div class="success-effect">
          <div class="success-icon">✓</div>
          <div class="success-rings">
            <div class="ring ring1"></div>
            <div class="ring ring2"></div>
            <div class="ring ring3"></div>
          </div>
        </div>
        <h3>¡Proyecto creado exitosamente!</h3>
        <p>Actualizando proyectos...</p>
      </div>
    {:else}
      <form on:submit|preventDefault={handleSubmit} class="animated-form">
        <div class="input-group" class:active={activeField === 'name'}>
          <label for="name">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21V19C19 17.9391 18.5786 16.9217 17.8284 16.1716C17.0783 15.4214 16.0609 15 15 15H9C7.93913 15 6.92172 15.4214 6.17157 16.1716C5.42143 16.9217 5 17.9391 5 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Nombre del proyecto
          </label>
          <input
            type="text"
            id="name"
            name="name"
            bind:value={form.name}
            on:focus={() => handleFocus('name')}
            on:blur={handleBlur}
            placeholder="Ingrese el nombre del proyecto"
            required
          />
          <div class="input-highlight"></div>
        </div>

        <div class="input-group" class:active={activeField === 'description'}>
          <label for="description">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            bind:value={form.description}
            on:focus={() => handleFocus('description')}
            on:blur={handleBlur}
            placeholder="Describa su proyecto"
            rows={4}
          ></textarea>
          <div class="input-highlight"></div>
        </div>

        <div class="dates-container">
          <div class="input-group date" class:active={activeField === 'startDate'}>
            <label for="startDate">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Fecha de inicio
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              bind:value={form.startDate}
              on:focus={() => handleFocus('startDate')}
              on:blur={handleBlur}
            />
            <div class="input-highlight"></div>
          </div>

          <div class="input-group date" class:active={activeField === 'endDate'}>
            <label for="endDate">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 16L11 18L15 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Fecha de finalización
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              bind:value={form.endDate}
              on:focus={() => handleFocus('endDate')}
              on:blur={handleBlur}
            />
            <div class="input-highlight"></div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          class="submit-button"
          class:loading
        >
          <span class="button-content">
            <span class="button-text">{loading ? "Creando proyecto..." : "Crear proyecto"}</span>
            <span class="button-icon">{loading ? "⟳" : "✓"}</span>
          </span>
          <span class="button-background"></span>
        </button>

        {#if error}
          <div class="error-container" role="alert">
            <div class="error-icon">!</div>
            <p>{error}</p>
          </div>
        {/if}
      </form>
    {/if}
  </div>
</div>

<style>
  .proyecto-page {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    z-index: 1000;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .animated-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .animated-shape {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    opacity: 0.1;
    animation: float 20s infinite;
  }

  .shape1 {
    width: 300px;
    height: 300px;
    top: -150px;
    left: -150px;
  }

  .shape2 {
    width: 200px;
    height: 200px;
    top: 50%;
    right: -100px;
    animation-delay: -5s;
  }

  .shape3 {
    width: 150px;
    height: 150px;
    bottom: -75px;
    left: 30%;
    animation-delay: -10s;
  }

  .shape4 {
    width: 250px;
    height: 250px;
    top: 20%;
    left: -125px;
    animation-delay: -15s;
  }

  .form-wrapper {
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

  .form-header {
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  }

  .form-title-icon {
    width: 40px;
    height: 40px;
    margin-right: 1rem;
    color: #3b82f6;
  }

  h1 {
    color: #f8fafc;
    font-size: 1.5rem;
    margin: 0;
    font-weight: 600;
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

  .input-group {
    margin-bottom: 1.5rem;
    position: relative;
  }

  .input-group.active label {
    color: #3b82f6;
  }

  label {
    display: flex;
    align-items: center;
    color: #94a3b8;
    margin-bottom: 0.5rem;
    transition: color 0.3s ease;
    font-size: 0.875rem;
    font-weight: 500;
  }

  label svg {
    width: 20px;
    height: 20px;
    margin-right: 0.5rem;
  }

  input, textarea {
    width: 100%;
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 8px;
    color: #f8fafc;
    transition: all 0.3s ease;
    font-family: 'Inter', sans-serif;
  }

  input:focus, textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    outline: none;
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }

  .dates-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .input-group.date input {
    color-scheme: dark;
  }

  .input-group.date input::-webkit-calendar-picker-indicator {
    filter: invert(0.8);
    cursor: pointer;
    opacity: 0.6;
  }

  .input-group.date input::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }

  .submit-button {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
  }

  .submit-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }

  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    position: relative;
    z-index: 2;
  }

  .success-container {
    text-align: center;
    padding: 2rem;
    color: #f8fafc;
  }

  .success-effect {
    position: relative;
    width: 100px;
    height: 100px;
    margin: 0 auto 2rem;
  }

  .success-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 3rem;
    color: #10b981;
  }

  .success-rings {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .ring {
    position: absolute;
    border: 2px solid #10b981;
    border-radius: 50%;
    animation: ripple 1.5s linear infinite;
  }

  .ring1 { animation-delay: 0s; }
  .ring2 { animation-delay: 0.5s; }
  .ring3 { animation-delay: 1s; }

  @keyframes ripple {
    0% {
      width: 0;
      height: 0;
      opacity: 1;
    }
    100% {
      width: 100%;
      height: 100%;
      opacity: 0;
    }
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(20px, -20px); }
  }

  .shake-animation {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }

  .error-container {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .error-icon {
    width: 24px;
    height: 24px;
    background: rgba(239, 68, 68, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
</style>