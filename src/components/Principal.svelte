<script lang="ts">
  import { onMount } from 'svelte';
  import api from '../lib/api';
  
  // Mantenemos tu implementación existente con soporte para onOpenTask
  export let onNavigate: (route: string) => void;
  export let onOpenTask: (taskId: number) => void = () => {}; // Añadido como prop opcional
  
  let selectedTaskId = null;
  let showTaskDetail = false;

  // Modificamos para usar onOpenTask si se proporciona
  function handleTaskClick(taskId) {
      if (typeof onOpenTask === 'function') {
          // Si App.svelte proporciona esta función, la usamos
          onOpenTask(taskId);
      } else {
          // De lo contrario, mantenemos la lógica local
          selectedTaskId = taskId;
          showTaskDetail = true;
      }
  }

  function handleCloseTaskDetail() {
      showTaskDetail = false;
      selectedTaskId = null;
  }
  
  // Variables reactivas
  let userData = { firstName: 'Usuario', lastName: 'Desconocido' };
  let dashboardData = null;
  let isLoading = true;
  let error = '';
  
  // Obtener la fecha actual
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const dateString = today.toLocaleDateString('es-ES', options);
  
  // Función para obtener iniciales de un nombre
  function getInitials(firstName, lastName) {
    return `${firstName ? firstName[0] : ''}${lastName ? lastName[0] : ''}`;
  }
  
  // Función para formatear fecha relativa
  function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  }
  
  // Función para identificar clase CSS de prioridad
  function getPriorityClass(priority) {
    switch (priority.toLowerCase()) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      case 'critical': return 'critical';
      default: return '';
    }
  }
  
  // Función para identificar clase CSS de estado
  function getStatusClass(status) {
    switch (status.toLowerCase()) {
      case 'todo': return 'todo';
      case 'in progress': return 'in-progress';
      case 'review': return 'review';
      case 'blocked': return 'blocked';
      default: return '';
    }
  }
  
  // Función para cargar los datos del dashboard desde la API
  async function loadDashboardData() {
    try {
      isLoading = true;
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || !user) {
        onNavigate('/login');
        return;
      }
      
      // Configurar el token para todas las solicitudes
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Obtener información del usuario desde localStorage
      const userString = localStorage.getItem('user');
      if (userString) {
        userData = JSON.parse(userString);
      }
      
      // Obtener datos del dashboard desde tu API
      const dashboardResponse = await api.get('/dashboard');
      
      // Obtener proyectos del usuario actual
      const response = await api.get(`/projects/owner/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Asignar los datos directamente desde la respuesta de tu API
      dashboardData = {
        ...dashboardResponse.data,
        projects: response.data
      };
      
      console.log('Dashboard data:', dashboardData);
      
      isLoading = false;
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
      isLoading = false;
      
      // Manejar diferentes tipos de errores
      if (err.response) {
        // Error de respuesta del servidor
        if (err.response.status === 401 || err.response.status === 403) {
          error = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
          setTimeout(() => {
            localStorage.removeItem('token');
            onNavigate('/login');
          }, 2000);
        } else if (err.response.status === 404) {
          error = 'El servicio de dashboard no está disponible.';
        } else {
          error = `Error del servidor: ${err.response.status} ${err.response.statusText}`;
        }
      } else if (err.request) {
        // Error de conexión
        error = 'No se pudo conectar con el servidor.';
      } else {
        // Otro tipo de error
        error = `Error inesperado: ${err.message}`;
      }
    }
  }
  
  // Función para cerrar sesión
  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onNavigate('/login');
  }
  
  onMount(() => {
    loadDashboardData();
  });
</script>

<div class="dashboard-container">
  <!-- Barra lateral -->
  <aside class="sidebar">
    <div class="logo">
      <svg width="36" height="36" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="20" stroke="#3498db" stroke-width="2" />
        <path d="M16 25L22 31L34 19" stroke="#3498db" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M25 10V14M25 36V40M40 25H36M14 25H10M35.4 14.6L32.5 17.5M17.5 32.5L14.6 35.4M35.4 35.4L32.5 32.5M17.5 17.5L14.6 14.6" stroke="#3498db" stroke-width="2" stroke-linecap="round" />
      </svg>
      <span class="app-name">Task<span class="highlight">Master</span></span>
    </div>
    
    <nav class="menu">
      <a href="#inicio" class="menu-item active" on:click|preventDefault={() => onNavigate('/principal')}>
        <i class="icon">🏠</i>
        <span>Inicio</span>
      </a>
      <a href="#proyectos" class="menu-item" on:click|preventDefault={() => onNavigate('/proyectos')}>
        <i class="icon">📁</i>
        <span>Proyectos</span>
      </a>
      <a href="#tareas" class="menu-item" on:click|preventDefault={() => onNavigate('/tareas')}>
        <i class="icon">✓</i>
        <span>Tareas</span>
      </a>
    
      <a href="#equipo" class="menu-item">
        <i class="icon">👥</i>
        <span>Equipo</span>
      </a>
      <a href="#perfil" class="menu-item" on:click|preventDefault={() => onNavigate('/perfil')}>
        <i class="icon">👤</i>
        <span>Perfil</span>
      </a>
    </nav>
    
    <button on:click={handleLogout} class="logout-btn">
      <i class="icon">🔒</i>
      <span>Cerrar Sesión</span>
    </button>
  </aside>
  
  <!-- Contenido principal -->
  <main class="main-content">
    <!-- Cabecera -->
    <header class="header">
      <div class="welcome">
        <h1>Buenas {today.getHours() < 12 ? 'días' : today.getHours() < 19 ? 'tardes' : 'noches'}, 
          <span class="user-name">{userData.firstName} {userData.lastName}</span> 
          <span class="wave">👋</span>
        </h1>
        <p class="date">{dateString}</p>
      </div>
      
      <div class="header-actions">
        <button class="icon-btn">
          <i class="icon">💬</i>
        </button>
        <button class="icon-btn">
          <i class="icon">🔔</i>
          <span class="badge">1</span>
        </button>
        <div class="user-avatar">
          <span>
            {getInitials(userData.firstName, userData.lastName)}
          </span>
        </div>
      </div>
    </header>
    
    <!-- Contenido del dashboard -->
    <div class="dashboard-content">
      {#if isLoading}
        <div class="loading">
          <span class="spinner"></span>
          <p>Cargando datos...</p>
        </div>
      {:else if error}
        <div class="error-message">
          <p>{error}</p>
          <button on:click={loadDashboardData}>Reintentar</button>
        </div>
      {:else if dashboardData}
        <!-- Fila 1: Métricas principales -->
        <div class="metrics-row">
          <div class="metric-card">
            <div class="metric-icon project-icon">📁</div>
            <div class="metric-content">
              <h2 class="metric-value">{dashboardData.activeProjects.count}</h2>
              <p class="metric-label">Proyectos Activos</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon task-icon">📝</div>
            <div class="metric-content">
              <h2 class="metric-value">{dashboardData.pendingTasks.count}</h2>
              <p class="metric-label">Tareas Pendientes</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon completed-icon">✓</div>
            <div class="metric-content">
              <h2 class="metric-value">{dashboardData.completedTasks.count}</h2>
              <p class="metric-label">Completadas</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon team-icon">👥</div>
            <div class="metric-content">
              <h2 class="metric-value">
                {dashboardData.taskCollaborators.tasks.reduce((sum, task) => sum + task.collaboratorCount, 0)}
              </h2>
              <p class="metric-label">Colaboradores</p>
            </div>
          </div>
        </div>
        
        <!-- Fila 2: Gráficos -->
        <div class="charts-row">
          <div class="chart-card">
            <h3 class="chart-title">Proyectos por Estado</h3>
            <div class="chart-container donut-chart">
              <div class="placeholder-chart">
                <div class="donut active-projects"></div>
                <div class="chart-legend">
                  <div class="legend-item">
                    <span class="color-box active"></span>
                    <span>Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="chart-card">
            <h3 class="chart-title">Tareas por Prioridad</h3>
            <div class="chart-container bar-chart">
              <div class="placeholder-chart">
                <div class="bar-container">
                  <div class="bar high"></div>
                  <div class="bar medium"></div>
                  <div class="bar low"></div>
                  <div class="bar critical"></div>
                </div>
                <div class="chart-x-labels">
                  <span>High</span>
                  <span>Medium</span>
                  <span>Low</span>
                  <span>Critical</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Fila 3: Gráfico de línea de tareas completadas -->
        <div class="timeline-card">
          <h3 class="chart-title">Tareas Completadas (Últimos 7 días)</h3>
          <div class="chart-container line-chart">
            <div class="placeholder-chart timeline">
              <div class="line"></div>
            </div>
          </div>
        </div>
        
        <!-- Fila 4: Proyectos activos y actividad reciente -->
        <div class="detail-row">
          <div class="detail-card project-list">
            <div class="card-header">
              <h3 class="card-title">Proyectos Activos</h3>
              <a href="#ver-todos" class="view-all">Ver todos</a>
            </div>
            
            <div class="projects-container">
              {#each dashboardData.activeProjects.projects as project}
                <div class="project-item">
                  <div class="project-details">
                    <h4 class="project-name">{project.name}</h4>
                    <p class="project-description">{project.description || ''}</p>
                    
                    <div class="project-meta">
                      <span class="meta-item"><i class="meta-icon">📝</i> {project.taskCount} tareas</span>
                      <span class="meta-item"><i class="meta-icon">👥</i> {project.memberCount} miembros</span>
                    </div>
                    
                    <div class="progress-bar">
                      <div class="progress" style="width: {(project.taskCount > 0) ? '75%' : '10%'};"></div>
                    </div>
                  </div>
                  
                  <div class="project-info">
                    <span class={`status-badge ${project.status.toLowerCase()}`}>{project.status}</span>
                  </div>
                  
                  <div class="project-owner">
                    <div class="avatar">
                      {getInitials(project.owner.firstName, project.owner.lastName)}
                    </div>
                    <span class="owner-name">{project.owner.firstName} {project.owner.lastName}</span>
                  </div>
                </div>
              {/each}
              
              <button class="create-project-btn" on:click|preventDefault={() => onNavigate('/crear-proyecto')}>
                <i class="add-icon">+</i> Crear Proyecto
              </button>
            </div>
          </div>
          
          <div class="detail-card activity-list">
            <div class="card-header">
              <h3 class="card-title">Actividad Reciente</h3>
            </div>
            
            <div class="activities-container">
              {#each dashboardData.recentActivity.activities as activity}
                <div class="activity-item">
                  <div class="activity-icon">
                    <i class="activity-type-icon">
                      {activity.type === 'task_created' ? '📝' : 
                       activity.type === 'comment_added' ? '💬' : 
                       activity.type === 'attachment_added' ? '📎' : '🔄'}
                    </i>
                  </div>
                  
                  <div class="activity-details">
                    <div class="activity-header">
                      <span class="user-name">{activity.userName}</span>
                      <span class="activity-action"> 
                        {activity.type === 'task_created' ? 'creó una nueva tarea' : 
                         activity.type === 'comment_added' ? 'comentó en' : 
                         activity.type === 'attachment_added' ? 'adjuntó un archivo a' : 'actualizó'}
                      </span>
                      <span class="task-name">{activity.type === 'task_created' || activity.type === 'task_updated' ? activity.title : activity.taskTitle}</span>
                      <span>en</span>
                      <span class="project-name">{activity.projectName}</span>
                    </div>
                    
                    <div class="activity-time">
                      {getRelativeTime(activity.timestamp)}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
        
        <!-- Fila 5: Tareas pendientes -->
        <div class="detail-card pending-tasks">
          <div class="card-header">
            <h3 class="card-title">Tareas Pendientes</h3>
            <a href="#ver-todas" class="view-all" on:click|preventDefault={() => onNavigate('/tareas')}>Ver todas</a>
          </div>
          
          <div class="tasks-container">
            {#each dashboardData.pendingTasks.tasks as task}
              <div class="task-item" on:click={() => handleTaskClick(task.id)}>
                <div class="task-header">
                  <h4 class="task-title">{task.title}</h4>
                  <span class={`priority-badge ${getPriorityClass(task.priority)}`}>{task.priority}</span>
                </div>
                
                <div class="task-meta">
                  <div class="task-project">
                    <i class="folder-icon">📁</i>
                    <span>{task.project.name}</span>
                  </div>
                  
                  <div class="task-due-date">
                    {#if task.dueDate}
                      <i class="calendar-icon">📅</i>
                      <span>{new Date(task.dueDate).toLocaleDateString('es-ES', {day: '2-digit', month: 'long', year: 'numeric'})}</span>
                    {:else}
                      <i class="calendar-icon">📅</i>
                      <span>Sin fecha</span>
                    {/if}
                  </div>
                </div>
                
                <div class="task-footer">
                  <div class="task-assignee">
                    {#if task.assignee}
                      <div class="avatar">
                        {getInitials(task.assignee.firstName, task.assignee.lastName)}
                      </div>
                      <span>{task.assignee.firstName} {task.assignee.lastName}</span>
                    {:else}
                      <span class="unassigned">Sin asignar</span>
                    {/if}
                  </div>
                  
                  <span class={`status-badge ${getStatusClass(task.status)}`}>{task.status}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </main>

  <!-- Mantenemos tu implementación local en caso de que App.svelte no gestione el modal -->
  {#if showTaskDetail && selectedTaskId && typeof onOpenTask !== 'function'}
    <div style="z-index:2000;">
      <svelte:component this={DetalleTarea} 
        taskId={selectedTaskId} 
        onClose={handleCloseTaskDetail}
        onSuccess={() => {
          handleCloseTaskDetail();
          loadDashboardData(); // Recargamos los datos al actualizar
        }}
      />
    </div>
  {/if}
</div>


  <style>
    :global(body) {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #121212;
      color: #ffffff;
    }
    
    .dashboard-container {
      display: flex;
      min-height: 100vh;
    }
    
    /* Barra lateral */
    .sidebar {
      width: 200px;
      background-color: #1e1e1e;
      display: flex;
      flex-direction: column;
      padding: 20px 0;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
    }
    
    .logo {
      display: flex;
      align-items: center;
      padding: 0 20px;
      margin-bottom: 30px;
    }
    
    .app-name {
      margin-left: 10px;
      font-size: 18px;
      font-weight: 700;
    }
    
    .highlight {
      color: #3498db;
    }
    
    .menu {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    
    .menu-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: #b0b0b0;
      text-decoration: none;
      transition: all 0.3s;
      border-left: 3px solid transparent;
    }
    
    .menu-item.active {
      background-color: rgba(52, 152, 219, 0.1);
      color: #3498db;
      border-left-color: #3498db;
    }
    
    .menu-item:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: #ffffff;
    }
    
    .icon {
      font-size: 16px;
      margin-right: 10px;
      min-width: 20px;
      text-align: center;
    }
    
    .logout-btn {
      display: flex;
      align-items: center;
      margin: 20px;
      padding: 12px;
      background: none;
      border: 1px solid #e74c3c;
      color: #e74c3c;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .logout-btn:hover {
      background-color: rgba(231, 76, 60, 0.1);
    }
    
    /* Contenido principal */
    .main-content {
      flex-grow: 1;
      padding: 20px;
      overflow-y: auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    
    .welcome h1 {
      font-size: 24px;
      margin: 0;
      font-weight: 500;
    }
    
    .user-name {
      color: #3498db;
    }
    
    .wave {
      animation: wave 2s infinite;
      display: inline-block;
      transform-origin: 70% 70%;
    }
    
    @keyframes wave {
      0% { transform: rotate(0deg); }
      10% { transform: rotate(14deg); }
      20% { transform: rotate(-8deg); }
      30% { transform: rotate(14deg); }
      40% { transform: rotate(-4deg); }
      50% { transform: rotate(10deg); }
      60% { transform: rotate(0deg); }
      100% { transform: rotate(0deg); }
    }
    
    .date {
      color: #b0b0b0;
      margin: 5px 0 0;
      font-size: 14px;
    }
    
    .header-actions {
      display: flex;
      align-items: center;
    }
    
    .icon-btn {
      background: none;
      border: none;
      color: #b0b0b0;
      font-size: 20px;
      margin-left: 15px;
      cursor: pointer;
      position: relative;
      padding: 5px;
    }
    
    .badge {
      position: absolute;
      top: 0;
      right: 0;
      background-color: #e74c3c;
      color: white;
      font-size: 10px;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .user-avatar {
      width: 38px;
      height: 38px;
      background-color: #3498db;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 15px;
      font-weight: bold;
      cursor: pointer;
    }
    
    /* Avatar genérico */
    .avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #3498db;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }
    
    /* Dashboard content */
    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .loading, .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      text-align: center;
    }
    
    .spinner {
      display: inline-block;
      width: 30px;
      height: 30px;
      border: 3px solid rgba(52, 152, 219, 0.3);
      border-radius: 50%;
      border-top-color: #3498db;
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error-message button {
      margin-top: 15px;
      padding: 8px 16px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    /* Métricas (continuación) */
  .metrics-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }
  
  .metric-card {
    background-color: #1e1e1e;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .metric-icon {
    width: 45px;
    height: 45px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin-right: 15px;
  }
  
  .project-icon {
    background-color: rgba(52, 152, 219, 0.2);
    color: #3498db;
  }
  
  .task-icon {
    background-color: rgba(155, 89, 182, 0.2);
    color: #9b59b6;
  }
  
  .completed-icon {
    background-color: rgba(46, 204, 113, 0.2);
    color: #2ecc71;
  }
  
  .team-icon {
    background-color: rgba(241, 196, 15, 0.2);
    color: #f1c40f;
  }
  
  .metric-content {
    flex-grow: 1;
  }
  
  .metric-value {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 5px;
  }
  
  .metric-label {
    color: #b0b0b0;
    margin: 0;
    font-size: 14px;
  }
  
  /* Gráficos */
  .charts-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .chart-card, .timeline-card, .detail-card {
    background-color: #1e1e1e;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .card-title, .chart-title {
    margin: 0;
    margin-bottom: 20px;
    font-weight: 500;
    font-size: 18px;
    color: #ffffff;
  }
  
  .view-all {
    color: #3498db;
    font-size: 14px;
    text-decoration: none;
  }
  
  .chart-container {
    height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  /* Placeholders para los gráficos */
  .placeholder-chart {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
  }
  
  .donut {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    border: 20px solid #2ecc71;
    border-bottom-color: transparent;
    border-left-color: transparent;
    transform: rotate(45deg);
  }
  
  .chart-legend {
    display: flex;
    margin-top: 15px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    margin-right: 15px;
  }
  
  .color-box {
    width: 12px;
    height: 12px;
    margin-right: 5px;
    border-radius: 2px;
  }
  
  .color-box.active {
    background-color: #2ecc71;
  }
  
  .bar-container {
    display: flex;
    align-items: flex-end;
    height: 150px;
    width: 100%;
    justify-content: space-around;
  }
  
  .bar {
    width: 40px;
    border-radius: 4px 4px 0 0;
  }
  
  .bar.high {
    height: 70%;
    background-color: #e74c3c;
  }
  
  .bar.medium {
    height: 50%;
    background-color: #f39c12;
  }
  
  .bar.low {
    height: 30%;
    background-color: #2ecc71;
  }
  
  .bar.critical {
    height: 40%;
    background-color: #95a5a6;
  }
  
  .chart-x-labels {
    display: flex;
    justify-content: space-around;
    width: 100%;
    margin-top: 10px;
    color: #b0b0b0;
    font-size: 12px;
  }
  
  .timeline {
    width: 100%;
    display: flex;
    align-items: center;
  }
  
  .line {
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, rgba(52, 152, 219, 0.1) 0%, rgba(142, 68, 173, 0.2) 100%);
    position: relative;
  }
  
  .line::before, .line::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #8e44ad;
  }
  
  .line::before {
    top: -3px;
    left: 20%;
  }
  
  .line::after {
    top: -3px;
    right: 30%;
    background-color: #3498db;
  }
  
  /* Detalle fila */
  .detail-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  /* Proyectos */
  .projects-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .project-item {
    background-color: #252525;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .project-details {
    flex: 1;
  }
  
  .project-name {
    margin: 0 0 5px;
    font-size: 16px;
    font-weight: 500;
  }
  
  .project-description {
    margin: 0 0 10px;
    color: #b0b0b0;
    font-size: 12px;
  }
  
  .project-meta {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #b0b0b0;
  }
  
  .meta-icon {
    margin-right: 5px;
    font-size: 10px;
  }
  
  .progress-bar {
    height: 6px;
    background-color: rgba(52, 152, 219, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .progress {
    height: 100%;
    background-color: #3498db;
    border-radius: 3px;
  }
  
  .project-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
  }
  
  .status-badge {
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .status-badge.active {
    background-color: rgba(46, 204, 113, 0.2);
    color: #2ecc71;
  }
  
  .status-badge.todo {
    background-color: rgba(52, 152, 219, 0.2);
    color: #3498db;
  }
  
  .status-badge.in-progress {
    background-color: rgba(241, 196, 15, 0.2);
    color: #f1c40f;
  }
  
  .status-badge.review {
    background-color: rgba(230, 126, 34, 0.2);
    color: #e67e22;
  }
  
  .status-badge.blocked {
    background-color: rgba(231, 76, 60, 0.2);
    color: #e74c3c;
  }
  
  .project-owner {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 5px;
  }
  
  .owner-name {
    font-size: 14px;
  }
  
  .create-project-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    background-color: rgba(52, 152, 219, 0.1);
    color: #3498db;
    border: 1px dashed #3498db;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .create-project-btn:hover {
    background-color: rgba(52, 152, 219, 0.2);
  }
  
  .add-icon {
    font-size: 18px;
  }
  
  /* Actividad reciente */
  .activities-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .activity-item {
    display: flex;
    gap: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .activity-item:last-child {
    border-bottom: none;
  }
  
  .activity-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: rgba(52, 152, 219, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  
  .activity-details {
    flex: 1;
  }
  
  .activity-header {
    margin-bottom: 5px;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .activity-time {
    font-size: 12px;
    color: #b0b0b0;
  }
  
  /* Tareas pendientes */
  .tasks-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 15px;
  }
  
  .task-item {
    background-color: #252525;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .task-title {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    flex: 1;
  }
  
  .priority-badge {
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .priority-badge.high {
    background-color: rgba(231, 76, 60, 0.2);
    color: #e74c3c;
  }
  
  .priority-badge.medium {
    background-color: rgba(243, 156, 18, 0.2);
    color: #f39c12;
  }
  
  .priority-badge.low {
    background-color: rgba(46, 204, 113, 0.2);
    color: #2ecc71;
  }
  
  .priority-badge.critical {
    background-color: rgba(149, 165, 166, 0.2);
    color: #95a5a6;
  }
  
  .task-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
    color: #b0b0b0;
  }
  
  .task-project, .task-due-date {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .folder-icon, .calendar-icon {
    font-size: 14px;
  }
  
  .task-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 5px;
  }
  
  .task-assignee {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  
  .unassigned {
    color: #b0b0b0;
    font-style: italic;
    font-size: 12px;
  }
  
  /* Responsive */
  @media (max-width: 992px) {
    .detail-row {
      grid-template-columns: 1fr;
    }
    
    .tasks-container {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 768px) {
    .dashboard-container {
      flex-direction: column;
    }
    
    .sidebar {
      width: 100%;
      padding: 10px 0;
    }
    
    .metrics-row, .charts-row {
      grid-template-columns: 1fr;
    }
  }
</style>