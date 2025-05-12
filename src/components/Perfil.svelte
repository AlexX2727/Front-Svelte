<script lang="ts">
    import { onMount } from 'svelte';
    import api from '../lib/api';
    
    export let onNavigate: (route: string) => void;
    
    // Datos del usuario
    let userData = {
      id: 0,
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      phone: "",
      avatar: null,
      role: { name: "" }
    };
    
    let loading = true;
    let error = "";
    
    onMount(() => {
        loadUserData();
    });

    // Cargar datos del usuario
    async function loadUserData() {
        try {
            loading = true;
            error = "";
            
            const token = localStorage.getItem("token");
            const userString = localStorage.getItem("user");
            
            if (!token) {
                onNavigate('/login');
                return;
            }
            
            if (!userString) {
                error = "No se encontraron datos del usuario";
                loading = false;
                return;
            }

            // Configurar el token para todas las solicitudes
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Cargar datos iniciales del localStorage
            const localUser = JSON.parse(userString);
            userData = { ...userData, ...localUser };
            
            try {
                // Intentar obtener datos actualizados del servidor
                const response = await api.get(`/users/${localUser.id}`);
                userData = { ...userData, ...response.data };
                // Actualizar localStorage con los datos más recientes
                localStorage.setItem("user", JSON.stringify(userData));
            } catch (apiError) {
                console.warn("No se pudieron obtener datos actualizados del servidor, usando datos locales");
            }
            
            loading = false;
        } catch (err) {
            console.error("Error al cargar perfil:", err);
            error = "No se pudo cargar la información del perfil";
            loading = false;
            
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem('token');
                onNavigate('/login');
            }
        }
    }
    
    // Función para obtener las iniciales del usuario
    function getUserInitials() {
      if (userData.firstName && userData.lastName) {
        return `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`;
      } else if (userData.username) {
        return userData.username.charAt(0).toUpperCase();
      }
      return '?';
    }
    
    // Maneja la edición del perfil
    let isEditing = false;
    let formData = {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      phone: "",
    };
    
    let previewUrl: string | null = null;
    let success = "";
    let avatarFile: File | null = null;
    
    // Función para iniciar la edición
    function handleEditProfile() {
      formData = {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        username: userData.username || "",
        phone: userData.phone || "",
      };
      isEditing = true;
    }
    
    // Manejar cambio de avatar
    function handleAvatarChange(event: Event) {
      const input = event.target as HTMLInputElement;
      const files = input.files;
      
      if (files && files.length > 0) {
        const file = files[0];
        
        // Verificar tipo de archivo
        const validTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!validTypes.includes(file.type)) {
          error = "Por favor, selecciona una imagen válida (jpg, png, gif)";
          return;
        }
        
        // Verificar tamaño (5MB máximo)
        if (file.size > 5 * 1024 * 1024) {
          error = "La imagen debe pesar menos de 5MB";
          return;
        }
        
        // Guardar el archivo para subirlo después
        avatarFile = file;
        
        // Mostrar vista previa
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            previewUrl = reader.result as string;
          }
        };
        reader.readAsDataURL(file);
        error = "";
      }
    }
    
    // Manejar envío del formulario
    async function handleSubmit(event: Event) {
      event.preventDefault();
      loading = true;
      error = "";
      success = "";
      
      try {
        const formDataObject = new FormData();
        
        // Añadir todos los campos del formulario
        Object.entries(formData).forEach(([key, value]) => {
          if (value) {
            formDataObject.append(key, value);
          }
        });
        
        // Añadir avatar si se seleccionó uno nuevo
        if (avatarFile) {
          formDataObject.append('avatar', avatarFile);
        }
        
        const token = localStorage.getItem("token");
        const response = await fetch(`${api.defaults.baseURL}/users/${userData.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataObject
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        
        // Actualizar datos locales
        userData = { ...userData, ...responseData };
        localStorage.setItem("user", JSON.stringify(userData));
        
        success = "Perfil actualizado correctamente";
        isEditing = false;
        
        // Recargar los datos del perfil después de 1 segundo
        setTimeout(() => {
          success = "";
          loadUserData();
        }, 1000);
        
      } catch (err) {
        console.error("Error al actualizar perfil:", err);
        error = "No se pudo actualizar el perfil. Intenta de nuevo más tarde.";
      } finally {
        loading = false;
      }
    }
</script>

<div class="profile-container">
  <div class="profile-card">
    <div class="profile-header">
      <h1 class="profile-title">Mi Perfil</h1>
      <div class="profile-actions">
        {#if !isEditing}
          <button class="edit-button" on:click={handleEditProfile}>
            <span class="button-icon">✏️</span>
            <span class="button-text">Editar</span>
              </button>
        {/if}
      </div>
    </div>
    
    {#if loading}
      <div class="profile-loading">
        <div class="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    {:else if error}
      <div class="error-message">{error}</div>
    {:else if success}
      <div class="success-message">{success}</div>
    {:else}
      <div class="profile-content">
        {#if isEditing}
          <form on:submit={handleSubmit} class="edit-form">
            <div class="profile-avatar-container">
              <label for="avatar" class="avatar-label">
                {#if previewUrl || userData.avatar}
                  <img 
                    src={previewUrl || userData.avatar} 
                    alt="Avatar" 
                    class="profile-avatar" 
                  />
                {:else}
                  <div class="profile-avatar-placeholder">
                    {getUserInitials()}
                  </div>
                {/if}
                <div class="avatar-overlay">
                  <span>Cambiar foto</span>
                </div>
              </label>
              <input 
                type="file" 
                id="avatar" 
                accept="image/*" 
                on:change={handleAvatarChange} 
                style="display: none;"
              />
            </div>
            
            <div class="form-group">
              <label for="firstName">Nombre:</label>
              <input 
                type="text" 
                id="firstName" 
                bind:value={formData.firstName} 
                placeholder="Tu nombre"
              />
            </div>
            
            <div class="form-group">
              <label for="lastName">Apellido:</label>
              <input 
                type="text" 
                id="lastName" 
                bind:value={formData.lastName} 
                placeholder="Tu apellido"
              />
            </div>
            
            <div class="form-group">
              <label for="username">Usuario:</label>
              <input 
                type="text" 
                id="username" 
                bind:value={formData.username} 
                placeholder="Nombre de usuario"
              />
            </div>
            
            <div class="form-group">
              <label for="email">Email:</label>
              <input 
                type="email" 
                id="email" 
                bind:value={formData.email} 
                placeholder="Tu email"
              />
            </div>
            
            <div class="form-group">
              <label for="phone">Teléfono:</label>
              <input 
                type="tel" 
                id="phone" 
                bind:value={formData.phone} 
                placeholder="Tu teléfono"
              />
            </div>
            
            <div class="form-actions">
              <button type="submit" class="save-button">Guardar cambios</button>
              <button 
                type="button" 
                class="cancel-button" 
                on:click={() => isEditing = false}
              >
                Cancelar
              </button>
            </div>
          </form>
        {:else}
          <div class="profile-avatar-container">
            {#if userData.avatar}
              <img 
                src={userData.avatar} 
                alt="Avatar" 
                class="profile-avatar" 
              />
            {:else}
              <div class="profile-avatar-placeholder">
                {getUserInitials()}
              </div>
            {/if}
          </div>
          
          <div class="profile-info">
            <div class="info-section">
              <div class="info-group">
                <h2 class="section-title">Información Personal</h2>
                <div class="info-row">
                  <span class="info-label">Nombre:</span>
                  <span class="info-value">{userData.firstName || "No especificado"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Apellido:</span>
                  <span class="info-value">{userData.lastName || "No especificado"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Usuario:</span>
                  <span class="info-value">{userData.username || "No especificado"}</span>
                </div>
              </div>
              
              <div class="info-group">
                <h2 class="section-title">Información de Contacto</h2>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">{userData.email}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Teléfono:</span>
                  <span class="info-value">{userData.phone || "No especificado"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Rol:</span>
                  <span class="info-value role-badge">{userData.role?.name || "Usuario"}</span>
                </div>
              </div>
            </div>
          </div>
        {/if}
        
        {#if error}
          <div class="profile-error">{error}</div>
        {/if}
    </div>
    {/if}
  </div>
</div>


<style>
  /* Variables CSS */
  :root {
    --primary-bg: #1e1e1e;
    --card-bg: #252525;
    --text-primary: #eaeaea;
    --text-secondary: #a0a0a0;
    --accent-color: #3498db;
    --border-color: #333;
    --highlight-color: #555;
    --error-color: #e53935;
    --success-color: #43a047;
    --transition-time: 0.3s;
  }
  
  .profile-container {
    width: 100%;
    height: 100%;
    padding: 0;
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .profile-card {
    width: 100%;
    background-color: var(--primary-bg);
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    transition: transform var(--transition-time), box-shadow var(--transition-time);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .profile-header {
    padding: 25px 30px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(to right, rgba(40, 40, 40, 0.7), rgba(30, 30, 30, 0.9));
  }
  
  .profile-title {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    background: linear-gradient(45deg, #fff, #3498db, #fff);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shine 3s linear infinite;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
  
  @keyframes shine {
    to {
      background-position: 200% center;
    }
  }
  
  .profile-actions {
    display: flex;
    gap: 15px;
  }
  
  .edit-button {
    background: linear-gradient(135deg, var(--accent-color), #2980b9);
    color: var(--text-primary);
    border: none;
    border-radius: 8px;
    padding: 12px 20px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all var(--transition-time);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    letter-spacing: 0.5px;
  }
  
  .edit-button:hover {
    background: linear-gradient(135deg, #2980b9, var(--accent-color));
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  
  .button-icon {
    font-size: 18px;
    transition: transform 0.2s;
  }
  
  .profile-content {
    padding: 30px;
    display: flex;
    gap: 40px;
    background-color: rgba(30, 30, 30, 0.6);
  }
  
  @media (max-width: 768px) {
    .profile-content {
      flex-direction: column;
      align-items: center;
    }
  }
  
  .profile-avatar-container {
    flex-shrink: 0;
    position: relative;
  }
  
  .profile-avatar {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid var(--accent-color);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    transition: transform var(--transition-time), box-shadow var(--transition-time);
    animation: glow 3s infinite alternate;
  }
  
  .profile-avatar:hover {
    transform: scale(1.05) rotate(3deg);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  }
  
  .profile-avatar-placeholder {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, var(--accent-color), #2980b9);
    color: var(--text-primary);
    font-size: 60px;
    font-weight: bold;
    border: 4px solid var(--accent-color);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
    transition: all var(--transition-time);
    animation: glow 3s infinite alternate;
  }
  
  .profile-avatar-placeholder:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  }
  
  .profile-info {
    flex: 1;
  }
  
  .info-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
  }
  
  .info-group {
    margin-bottom: 25px;
    background-color: var(--card-bg);
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    transition: transform var(--transition-time), box-shadow var(--transition-time);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .info-group:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
  
  .section-title {
    margin: 0 0 25px 0;
    font-size: 22px;
    font-weight: 600;
    color: var(--text-primary);
    position: relative;
    padding-bottom: 12px;
    letter-spacing: 1px;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }
  
  .section-title::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, var(--accent-color), #2980b9);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  
  .info-group:hover .section-title::after {
    width: 100px;
  }
  
  .info-row {
    margin-bottom: 18px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    transition: all 0.3s ease;
  }
  
  .info-label {
    min-width: 100px;
    color: var(--text-secondary);
    letter-spacing: 0.5px;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    animation: textPulse 3s infinite;
  }
  
  @keyframes textPulse {
    0% { opacity: 0.8; }
    50% { opacity: 1; }
    100% { opacity: 0.8; }
  }
  
  .info-value {
    font-weight: 500;
    flex: 1;
    word-break: break-word;
    letter-spacing: 0.5px;
    color: var(--text-primary);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    transition: color 0.3s ease;
  }
  
  .info-row:hover .info-value {
    color: #ffffff;
  }
  
  .info-row:hover {
    background-color: rgba(255, 255, 255, 0.03);
    transform: translateX(8px);
    transition: all 0.3s ease;
    border-bottom-color: var(--accent-color);
    padding-left: 10px;
  }
  
  .role-badge {
    display: inline-block;
    padding: 6px 14px;
    background: linear-gradient(135deg, var(--accent-color), #2980b9);
    border-radius: 20px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
    text-transform: capitalize;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
  }
  
  .role-badge:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, #2980b9, var(--accent-color));
  }
  
  .profile-error {
    margin: 20px 30px;
    padding: 15px 20px;
    background-color: rgba(229, 57, 53, 0.1);
    border-left: 4px solid var(--error-color);
    color: var(--error-color);
    border-radius: 0 4px 4px 0;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  
  .profile-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }
  
  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(51, 51, 51, 0.3);
    border-top: 4px solid var(--accent-color);
    border-radius: 50%;
    animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    margin-bottom: 20px;
    box-shadow: 0 0 20px rgba(85, 85, 85, 0.1);
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes glow {
    0% { box-shadow: 0 0 5px rgba(52, 152, 219, 0.3); }
    50% { box-shadow: 0 0 15px rgba(52, 152, 219, 0.5); }
    100% { box-shadow: 0 0 5px rgba(52, 152, 219, 0.3); }
  }
  
  .edit-form {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #fff;
    font-weight: 500;
  }
  
  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #3498db;
    border-radius: 4px;
    background-color: #1e1e1e;
    color: #fff;
    font-size: 1rem;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: #2980b9;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .save-button, .cancel-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .save-button {
    background-color: #3498db;
    color: white;
  }
  
  .save-button:hover {
    background-color: #2980b9;
  }
  
  .cancel-button {
    background-color: #e74c3c;
    color: white;
  }
  
  .cancel-button:hover {
    background-color: #c0392b;
  }
  
  .avatar-label {
    position: relative;
    display: block;
    cursor: pointer;
  }
  
  .avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 50%;
  }
  
  .avatar-label:hover .avatar-overlay {
    opacity: 1;
  }
  
  .avatar-overlay span {
    color: white;
    font-size: 0.875rem;
  }
  
  .error-message {
    color: #e74c3c;
    padding: 1rem;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .success-message {
    color: #2ecc71;
    padding: 1rem;
    text-align: center;
    margin-bottom: 1rem;
  }
</style>