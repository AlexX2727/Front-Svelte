<script lang="ts">
  import { onMount } from 'svelte';
  import api from '../lib/api';
  import RegisterModal from './RegisterModal.svelte';
  
  export let onNavigate: (route: string) => void;

  let email = "";
  let password = "";
  let error = "";
  let isLoading = false;
  let mounted = false;
  let formElement: HTMLFormElement;
  let showRegisterModal = false;

  onMount(() => {
    mounted = true;
    return () => mounted = false;
  });

  const handleLogin = async (e: SubmitEvent) => {
    e.preventDefault();
    error = "";
    isLoading = true;

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.acces_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      // Pequeño retraso para mostrar la animación de carga
      setTimeout(() => {
        isLoading = false;
        onNavigate("/principal");
      }, 800);
    } catch (err) {
      isLoading = false;
      error = "Credenciales incorrectas";
      
      // Animación de error
      formElement?.classList.add('shake');
      setTimeout(() => {
        formElement?.classList.remove('shake');
      }, 500);
    }
  };
  
  const openRegisterModal = () => {
    showRegisterModal = true;
  };
</script>

<div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #121212; padding: 20px; position: relative; overflow: hidden;">
  <div class="particles-container"></div>
  <div 
    class={mounted ? "fadeIn" : ""} 
    style="width: 100%; max-width: 380px; background-color: #1e1e1e; border-radius: 12px; padding: 30px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35); opacity: 0; transition: all 0.3s ease; display: flex; flex-direction: column; position: relative; z-index: 10; border: 1px solid rgba(52, 152, 219, 0.1);"
  >
    <div style="display: flex; justify-content: center; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; justify-content: center;" class="logo-icon">
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle class="circle-animation" cx="25" cy="25" r="20" stroke="#3498db" stroke-width="2" />
          <path class="check-animation" d="M16 25L22 31L34 19" stroke="#3498db" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          <path class="gear-animation" d="M25 10V14M25 36V40M40 25H36M14 25H10M35.4 14.6L32.5 17.5M17.5 32.5L14.6 35.4M35.4 35.4L32.5 32.5M17.5 17.5L14.6 14.6" stroke="#3498db" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>
    </div>
    
    <h2 style="text-align: center; color: #ffffff; font-size: 22px; margin-bottom: 30px; font-weight: 500; letter-spacing: 0.5px;">Iniciar Sesión</h2>
    
    <form on:submit={handleLogin} bind:this={formElement} style="display: flex; flex-direction: column; gap: 20px;" class="login-form">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label for="email" style="font-size: 14px; color: #b0b0b0; font-weight: 500; margin-left: 2px;">Correo Electrónico</label>
        <input
          id="email"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          bind:value={email}
          style="padding: 12px 16px; font-size: 15px; border: 1px solid #333333; border-radius: 8px; transition: all 0.3s ease; background-color: #252525; color: #ffffff; outline: none;"
          required
        />
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <label for="password" style="font-size: 14px; color: #b0b0b0; font-weight: 500; margin-left: 2px;">Contraseña</label>
        <input
          id="password"
          type="password"
          placeholder="Ingresa tu contraseña"
          bind:value={password}
          style="padding: 12px 16px; font-size: 15px; border: 1px solid #333333; border-radius: 8px; transition: all 0.3s ease; background-color: #252525; color: #ffffff; outline: none;"
          required
        />
      </div>
      
      <button 
        type="submit" 
        style={`padding: 14px; background-color: #3498db; color: white; border: none; border-radius: 8px; cursor: ${isLoading ? 'not-allowed' : 'pointer'}; font-size: 16px; font-weight: 500; margin-top: 15px; transition: all 0.3s ease; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3); ${isLoading ? 'background-color: #2980b9; opacity: 0.8;' : ''}`}
        disabled={isLoading}
        class="glow-button"
      >
        {#if isLoading}
          <span class="spinner"></span>
        {:else}
          Ingresar
        {/if}
      </button>
      
      {#if error}
        <p style="color: #e74c3c; font-size: 14px; text-align: center; margin: 15px 0 5px; padding: 8px 12px; background-color: rgba(231, 76, 60, 0.1); border-radius: 6px; border: 1px solid rgba(231, 76, 60, 0.2);">{error}</p>
      {/if}
    </form>

    <button
      type="button"
      on:click={openRegisterModal}
      style="margin-top: 25px; background-color: transparent; color: #b0b0b0; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: all 0.3s ease;"
      class="register-button"
    >
      ¿No tienes cuenta? <span style="color: #3498db; font-weight: 500;">Crea una aquí</span>
    </button>
  </div>
</div>

<RegisterModal 
  bind:showModal={showRegisterModal} 
  {onNavigate} 
  on:close={() => showRegisterModal = false}
/>

  
  <style>
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
      100% { transform: translateY(0px); }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes particle {
      0% {
        transform: translate(0, 0);
        opacity: 0;
      }
      20% {
        opacity: 1;
      }
      80% {
        opacity: 1;
      }
      100% {
        transform: translate(var(--tx), var(--ty));
        opacity: 0;
      }
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.6);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(52, 152, 219, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(52, 152, 219, 0);
      }
    }
    
    @keyframes rotateGear {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes drawCheck {
      from { stroke-dashoffset: 100; }
      to { stroke-dashoffset: 0; }
    }
    
    @keyframes circleRotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  
    :global(body) {
      margin: 0;
      padding: 0;
      background-color: #121212;
    }
    
    .fadeIn {
      animation: fadeIn 0.8s ease-out forwards;
    }
    
    .shake {
      animation: shake 0.5s ease-in-out;
    }
    
    .particles-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      overflow: hidden;
    }
    
    .particles-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #121212;
      background-image: 
        radial-gradient(rgba(52, 152, 219, 0.1) 1px, transparent 1px),
        radial-gradient(rgba(52, 152, 219, 0.07) 1px, transparent 1px);
      background-size: 30px 30px;
      background-position: 0 0, 15px 15px;
    }
    
    .particles-container::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(52, 152, 219, 0.08) 0%, rgba(0, 0, 0, 0) 70%);
    }
    
    input:focus {
      border-color: #3498db !important;
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2) !important;
      transform: translateY(-2px) !important;
    }
    
    input:hover {
      border-color: #3498db !important;
    }
    
    .glow-button:hover {
      animation: pulse 1.5s infinite;
      background-color: #2980b9;
      transform: translateY(-2px);
    }
    
    .register-button:hover span {
      text-decoration: underline;
    }
    
    /* Logo Animation */
    .circle-animation {
      stroke-dasharray: 126;
      animation: circleRotate 8s linear infinite;
      transform-origin: center;
    }
    
    .check-animation {
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
      animation: drawCheck 2s ease forwards 0.3s;
    }
    
    .gear-animation {
      animation: rotateGear 10s linear infinite;
      transform-origin: center;
      opacity: 0.8;
    }
    
    .logo-icon {
      animation: float 6s ease-in-out infinite;
    }
    
    /* Agregar la animación del spinner */
    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-in-out infinite;
    }
  </style>