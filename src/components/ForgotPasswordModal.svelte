<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import api from '../lib/api';
  
  export let showModal = false;
  
  const dispatch = createEventDispatcher();
  
  let email = "";
  let error = "";
  let success = "";
  let isLoading = false;
  let mounted = false;
  let formElement: HTMLFormElement;
  let showResetForm = false;
  let verificationCode = ""; // Cambiado de token a verificationCode
  let password = "";
  let confirmPassword = "";
  let emailForReset = ""; // Nuevo campo para almacenar el email en el formulario de reset
  
  onMount(() => {
    mounted = true;
    return () => mounted = false;
  });
  
  const closeModal = () => {
    showModal = false;
    dispatch('close');
    // Resetear el estado al cerrar
    setTimeout(() => {
      email = "";
      error = "";
      success = "";
      showResetForm = false;
      verificationCode = "";
      password = "";
      confirmPassword = "";
      emailForReset = "";
    }, 300);
  };
  
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('modal-backdrop')) {
      closeModal();
    }
  };
  
  const handleForgotPassword = async (e: SubmitEvent) => {
    e.preventDefault();
    error = "";
    success = "";
    isLoading = true;
    
    try {
      // Enviar solicitud de recuperación de contraseña
      const res = await api.post("/users/forgot-password", { email });
      
      // Mostrar mensaje de éxito
      success = res.data.message || "Se ha enviado un código de verificación a tu correo electrónico";
      
      // Guardar el email para el formulario de reset y mostrar el formulario de reset
      emailForReset = email;
      showResetForm = true;
      
      // Pequeño retraso para mostrar la animación de carga
      setTimeout(() => {
        isLoading = false;
      }, 800);
    } catch (err) {
      isLoading = false;
      
      // Manejar diferentes tipos de errores
      if (err.response && err.response.data && err.response.data.message) {
        error = err.response.data.message;
      } else {
        error = "Error al procesar la solicitud. Inténtalo de nuevo.";
      }
      
      // Animación de error
      formElement?.classList.add('shake');
      setTimeout(() => {
        formElement?.classList.remove('shake');
      }, 500);
    }
  };

  const handleResetPassword = async (e: SubmitEvent) => {
    e.preventDefault();
    error = "";
    success = "";
    isLoading = true;
    
    // Validaciones básicas
    if (password !== confirmPassword) {
      error = "Las contraseñas no coinciden";
      formElement?.classList.add('shake');
      setTimeout(() => {
        formElement?.classList.remove('shake');
      }, 500);
      isLoading = false;
      return;
    }
    
    if (password.length < 6) {
      error = "La contraseña debe tener al menos 6 caracteres";
      formElement?.classList.add('shake');
      setTimeout(() => {
        formElement?.classList.remove('shake');
      }, 500);
      isLoading = false;
      return;
    }
    
    try {
      // Enviar solicitud de restablecimiento de contraseña con el nuevo formato
      const res = await api.post("/users/reset-password", { 
        code: verificationCode, // Cambiado de token a code
        email: emailForReset, // Añadido el email
        password, 
        confirmPassword 
      });
      
      // Mostrar mensaje de éxito
      success = res.data.message || "Contraseña actualizada exitosamente";
      
      // Pequeño retraso para mostrar la animación de carga
      setTimeout(() => {
        isLoading = false;
        // Cerrar el modal después de un tiempo
        setTimeout(() => {
          closeModal();
        }, 2000);
      }, 800);
    } catch (err) {
      isLoading = false;
      
      // Manejar diferentes tipos de errores
      if (err.response && err.response.data && err.response.data.message) {
        error = err.response.data.message;
      } else if (err.response && err.response.status === 401) {
        error = "Código de verificación inválido o expirado";
      } else {
        error = "Error al restablecer la contraseña. Inténtalo de nuevo.";
      }
      
      // Animación de error
      formElement?.classList.add('shake');
      setTimeout(() => {
        formElement?.classList.remove('shake');
      }, 500);
    }
  };
  
  // Ya no necesitamos verificar un token en la URL, pero mantenemos la función onMount por si acaso
  onMount(() => {
    // Podríamos implementar alguna lógica adicional aquí si es necesario
  });
  
  // Cerrar modal con tecla Escape
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showModal) {
      closeModal();
    }
  };
</script>

<svelte:window on:keydown={handleKeydown} />

{#if showModal}
  <div 
    class="modal-backdrop"
    on:click={handleClickOutside}
    style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(5px); transition: all 0.3s ease;"
  >
    <div 
      class={mounted ? "fadeIn" : ""} 
      style="width: 100%; max-width: 450px; background-color: #1e1e1e; border-radius: 12px; padding: 30px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35); opacity: 0; transition: all 0.3s ease; display: flex; flex-direction: column; position: relative; z-index: 10; border: 1px solid rgba(52, 152, 219, 0.1);"
    >
      <button 
        on:click={closeModal}
        style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #b0b0b0; font-size: 20px; cursor: pointer; transition: all 0.2s ease; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%;"
        class="close-button"
      >
        ×
      </button>
      
      <div style="display: flex; justify-content: center; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: center;" class="logo-icon">
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle class="circle-animation" cx="25" cy="25" r="20" stroke="#3498db" stroke-width="2" />
            <path class="check-animation" d="M16 25L22 31L34 19" stroke="#3498db" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            <path class="gear-animation" d="M25 10V14M25 36V40M40 25H36M14 25H10M35.4 14.6L32.5 17.5M17.5 32.5L14.6 35.4M35.4 35.4L32.5 32.5M17.5 17.5L14.6 14.6" stroke="#3498db" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>
      </div>
      
      <h2 style="text-align: center; color: #ffffff; font-size: 22px; margin-bottom: 25px; font-weight: 500; letter-spacing: 0.5px;">
        {#if showResetForm}
          Restablecer Contraseña
        {:else}
          Recuperar Contraseña
        {/if}
      </h2>
      
      {#if !showResetForm}
        <!-- Formulario de solicitud de recuperación -->
        <form on:submit={handleForgotPassword} bind:this={formElement} style="display: flex; flex-direction: column; gap: 16px;" class="forgot-password-form">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label for="forgot-email" style="font-size: 14px; color: #b0b0b0; font-weight: 500; margin-left: 2px;">Correo Electrónico</label>
            <input
              id="forgot-email"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              bind:value={email}
              style="padding: 12px 16px; font-size: 15px; border: 1px solid #333333; border-radius: 8px; transition: all 0.3s ease; background-color: #252525; color: #ffffff; outline: none;"
              required
            />
          </div>
          
          <p style="font-size: 14px; color: #b0b0b0; margin: 0; text-align: center;">
            Ingresa tu correo electrónico y te enviaremos un código de verificación para restablecer tu contraseña.
          </p>
          
          <button 
            type="submit" 
            style={`padding: 14px; background-color: #3498db; color: white; border: none; border-radius: 8px; cursor: ${isLoading ? 'not-allowed' : 'pointer'}; font-size: 16px; font-weight: 500; margin-top: 10px; transition: all 0.3s ease; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3); ${isLoading ? 'background-color: #2980b9; opacity: 0.8;' : ''}`}
            disabled={isLoading}
            class="glow-button"
          >
            {#if isLoading}
              <span class="spinner"></span>
            {:else}
              Enviar Código
            {/if}
          </button>
          
          {#if error}
            <p style="color: #e74c3c; font-size: 14px; text-align: center; margin: 10px 0 5px; padding: 8px 12px; background-color: rgba(231, 76, 60, 0.1); border-radius: 6px; border: 1px solid rgba(231, 76, 60, 0.2);">{error}</p>
          {/if}
          
          {#if success}
            <p style="color: #2ecc71; font-size: 14px; text-align: center; margin: 10px 0 5px; padding: 8px 12px; background-color: rgba(46, 204, 113, 0.1); border-radius: 6px; border: 1px solid rgba(46, 204, 113, 0.2);">{success}</p>
          {/if}
        </form>
      {:else}
        <!-- Formulario de restablecimiento de contraseña -->
        <form on:submit={handleResetPassword} bind:this={formElement} style="display: flex; flex-direction: column; gap: 16px;" class="reset-password-form">
          <!-- Campo oculto para el email -->
          <input type="hidden" bind:value={emailForReset} />
          
          <!-- Campo para el código de verificación -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label for="verification-code" style="font-size: 14px; color: #b0b0b0; font-weight: 500; margin-left: 2px;">Código de Verificación</label>
            <input
              id="verification-code"
              type="text"
              placeholder="Ingresa el código recibido por correo"
              bind:value={verificationCode}
              style="padding: 12px 16px; font-size: 15px; border: 1px solid #333333; border-radius: 8px; transition: all 0.3s ease; background-color: #252525; color: #ffffff; outline: none;"
              required
            />
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label for="new-password" style="font-size: 14px; color: #b0b0b0; font-weight: 500; margin-left: 2px;">Nueva Contraseña</label>
            <input
              id="new-password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              bind:value={password}
              style="padding: 12px 16px; font-size: 15px; border: 1px solid #333333; border-radius: 8px; transition: all 0.3s ease; background-color: #252525; color: #ffffff; outline: none;"
              required
            />
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label for="confirm-new-password" style="font-size: 14px; color: #b0b0b0; font-weight: 500; margin-left: 2px;">Confirmar Contraseña</label>
            <input
              id="confirm-new-password"
              type="password"
              placeholder="Repite tu nueva contraseña"
              bind:value={confirmPassword}
              style="padding: 12px 16px; font-size: 15px; border: 1px solid #333333; border-radius: 8px; transition: all 0.3s ease; background-color: #252525; color: #ffffff; outline: none;"
              required
            />
          </div>
          
          <button 
            type="submit" 
            style={`padding: 14px; background-color: #3498db; color: white; border: none; border-radius: 8px; cursor: ${isLoading ? 'not-allowed' : 'pointer'}; font-size: 16px; font-weight: 500; margin-top: 10px; transition: all 0.3s ease; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3); ${isLoading ? 'background-color: #2980b9; opacity: 0.8;' : ''}`}
            disabled={isLoading}
            class="glow-button"
          >
            {#if isLoading}
              <span class="spinner"></span>
            {:else}
              Restablecer Contraseña
            {/if}
          </button>
          
          {#if error}
            <p style="color: #e74c3c; font-size: 14px; text-align: center; margin: 10px 0 5px; padding: 8px 12px; background-color: rgba(231, 76, 60, 0.1); border-radius: 6px; border: 1px solid rgba(231, 76, 60, 0.2);">{error}</p>
          {/if}
          
          {#if success}
            <p style="color: #2ecc71; font-size: 14px; text-align: center; margin: 10px 0 5px; padding: 8px 12px; background-color: rgba(46, 204, 113, 0.1); border-radius: 6px; border: 1px solid rgba(46, 204, 113, 0.2);">{success}</p>
          {/if}
        </form>
      {/if}
    </div>
  </div>
{/if}

<style>
/* Reutilizamos los mismos estilos de animación del componente Login */
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

.fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}

.shake {
  animation: shake 0.5s ease-in-out;
}

.close-button:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.1);
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

/* Spinner animation */
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