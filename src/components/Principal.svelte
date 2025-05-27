<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import api from '../lib/api';
  import { Chart, registerables } from 'chart.js';
  import ProjectMembersModal from './ProjectMembersModal.svelte';
  import EditProjectModal from './EditProjectModal.svelte';
  import AddMemberModal from './AddMemberModal.svelte';
  
  // Registrar todos los componentes de Chart.js
  Chart.register(...registerables);
  
  // Mantenemos tu implementación existente con soporte para onOpenTask
  export let onNavigate: (route: string) => void;
  export let onOpenTask: (taskId: number) => void = () => {}; // Añadido como prop opcional
  
  let selectedTaskId = null;
  let showTaskDetail = false;
  
  // Variables para el modal de miembros del proyecto
  let showMembersModal = false;
  let showProjectSelector = false;
  let selectedProjectId = null;

  // Variables para modales de proyectos
  let showEditProjectModal = false;
  let showAddMemberModal = false;
  let selectedProjectForEdit = null;

  // Variables para el sistema de tabs
  let activeTab = 'dashboard'; // dashboard, projects, activity, tasks

  // Variables para los gráficos
  let priorityChart: Chart | null = null;
  let statusChart: Chart | null = null;
  let weeklyChart: Chart | null = null;
  let completionChart: Chart | null = null;

  // Referencias a los canvas
  let priorityCanvas: HTMLCanvasElement;
  let statusCanvas: HTMLCanvasElement;
  let weeklyCanvas: HTMLCanvasElement;
  let completionCanvas: HTMLCanvasElement;

  // Estados de carga para filtros
  let isFilteringActivity = false;
  let isFilteringTasks = false;
  let isRefreshingActivity = false;
  let isRefreshingTasks = false;

  // Modificamos para usar onOpenTask si se proporciona
  function handleTaskClick(taskId) {
      if (typeof onOpenTask === 'function') {
          onOpenTask(taskId);
      } else {
          selectedTaskId = taskId;
          showTaskDetail = true;
      }
  }

  function handleCloseTaskDetail() {
      showTaskDetail = false;
      selectedTaskId = null;
  }
  
  function handleOpenMembersModal() {
    if (dashboardData?.activeProjects?.projects?.length > 0) {
      selectedProjectId = dashboardData.activeProjects.projects[0].id;
      showMembersModal = true;
    } else {
      error = 'No hay proyectos disponibles para mostrar miembros.';
      setTimeout(() => {
        error = '';
      }, 3000);
    }
  }
  
  function handleCloseMembersModal() {
    showMembersModal = false;
    selectedProjectId = null;
  }

  // Funciones para manejar modales de proyectos
  function handleEditProject(project) {
    selectedProjectForEdit = project;
    showEditProjectModal = true;
  }

  function handleAddMember(project) {
    selectedProjectForEdit = project;
    showAddMemberModal = true;
  }

  function handleCloseEditProject() {
    showEditProjectModal = false;
    selectedProjectForEdit = null;
  }

  function handleCloseAddMember() {
    showAddMemberModal = false;
    selectedProjectForEdit = null;
  }

  function handleProjectSuccess() {
    // Recargar datos cuando se actualice un proyecto o se añada un miembro
    loadDashboardData();
  }
  
  // Variables reactivas
  let userData = { firstName: 'Usuario', lastName: 'Desconocido' };
  let dashboardData = null;
  let isLoading = true;
  let error = '';
  
  // Variables para los gráficos dinámicos
  let priorityStats = { high: 0, medium: 0, low: 0, critical: 0, total: 0 };
  let statusStats = { todo: 0, inProgress: 0, review: 0, blocked: 0, done: 0, total: 0 };
  let weeklyCompletedTasks = [];
  let completionRate = 0;
  
  // Variables para filtros
  let selectedTimeRange = '7d'; // 7d, 30d, 90d
  let selectedProject = 'all'; // all, projectId
  let selectedPriority = 'all'; // all, high, medium, low, critical
  let projectOptions = [{ id: 'all', name: 'Todos los proyectos' }];
  
  // Variables para filtros de actividad y tareas
  let selectedActivityFilter = 'all'; // all, tasks, comments, attachments
  let selectedTaskPriorityFilter = 'all'; // all, critical, high, medium, low
  let selectedTaskStatusFilter = 'all'; // all, todo, in-progress, review
  
  // Obtener la fecha actual
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const dateString = today.toLocaleDateString('es-ES', options);
  
  // Función para cambiar de tab
  function changeTab(tab: string) {
    activeTab = tab;
  }

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
  
  // Función para traducir prioridades al español
  function translatePriority(priority) {
    const translations = {
      'critical': 'Crítica',
      'high': 'Alta', 
      'medium': 'Media',
      'low': 'Baja'
    };
    return translations[priority?.toLowerCase()] || priority;
  }

  // Función para traducir estados al español
  function translateStatus(status) {
    const translations = {
      'todo': 'Pendiente',
      'in progress': 'En Progreso',
      'review': 'En Revisión',
      'blocked': 'Bloqueada',
      'done': 'Completada'
    };
    return translations[status?.toLowerCase()] || status;
  }

  function getPriorityClass(priority) {
    if (!priority) return '';
    
    switch (priority.toString().toLowerCase()) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      case 'critical': return 'critical';
      default: return '';
    }
  }
  
  // Función para identificar clase CSS de estado
  function getStatusClass(status) {
    if (!status) return '';
    
    switch (status.toString().toLowerCase()) {
      case 'todo': return 'todo';
      case 'in progress': return 'in-progress';
      case 'review': return 'review';
      case 'blocked': return 'blocked';
      case 'done': return 'done';
      default: return '';
    }
  }

  // Función para calcular estadísticas de prioridades con filtros
  function calculatePriorityStats(tasks) {
    const stats = { high: 0, medium: 0, low: 0, critical: 0, total: 0 };
    
    if (!tasks || !Array.isArray(tasks)) return stats;
    
    const filteredTasks = filterTasks(tasks);
    
    filteredTasks.forEach(task => {
      if (!task || !task.priority) return;
      
      const priority = task.priority.toString().toLowerCase();
      if (priority === 'high') stats.high++;
      else if (priority === 'medium') stats.medium++;
      else if (priority === 'low') stats.low++;
      else if (priority === 'critical') stats.critical++;
      stats.total++;
    });
    
    return stats;
  }

  // Función para calcular estadísticas de estados con filtros
  function calculateStatusStats(allTasks) {
    const stats = { todo: 0, inProgress: 0, review: 0, blocked: 0, done: 0, total: 0 };
    
    if (!allTasks || !Array.isArray(allTasks)) return stats;
    
    const filteredTasks = filterTasks(allTasks);
    
    filteredTasks.forEach(task => {
      if (!task || !task.status) return;
      
      const status = task.status.toString().toLowerCase();
      if (status === 'todo') stats.todo++;
      else if (status === 'in progress') stats.inProgress++;
      else if (status === 'review') stats.review++;
      else if (status === 'blocked') stats.blocked++;
      else if (status === 'done' || status === 'completed') stats.done++;
      stats.total++;
    });
    
    return stats;
  }

  // Función para filtrar tareas
  function filterTasks(tasks) {
    return tasks.filter(task => {
      // Filtro por proyecto
      if (selectedProject !== 'all' && task.project?.id !== parseInt(selectedProject)) {
        return false;
      }
      
      // Filtro por prioridad
      if (selectedPriority !== 'all' && task.priority?.toLowerCase() !== selectedPriority) {
        return false;
      }
      
      return true;
    });
  }

  // Función para filtrar actividades
  function filterActivities(activities) {
    if (!activities || !Array.isArray(activities)) return [];
    
    return activities.filter(activity => {
      if (selectedActivityFilter === 'all') return true;
      if (selectedActivityFilter === 'tasks' && activity.type === 'task_created') return true;
      if (selectedActivityFilter === 'comments' && activity.type === 'comment_added') return true;
      if (selectedActivityFilter === 'attachments' && activity.type === 'attachment_added') return true;
      return false;
    });
  }

  // Función para filtrar tareas del board
  function filterBoardTasks(tasks) {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    return tasks.filter(task => {
      // Filtro por prioridad
      if (selectedTaskPriorityFilter !== 'all' && task.priority?.toLowerCase() !== selectedTaskPriorityFilter) {
        return false;
      }
      
      return true;
    });
  }

  // Función para manejar cambio de filtro de actividad
  async function handleActivityFilterChange() {
    isFilteringActivity = true;
    
    // Simular tiempo de carga para mostrar el efecto visual
    await new Promise(resolve => setTimeout(resolve, 800));
    
    isFilteringActivity = false;
  }

  // Función para manejar cambio de filtro de tareas
  async function handleTaskFilterChange() {
    isFilteringTasks = true;
    
    // Simular tiempo de carga para mostrar el efecto visual
    await new Promise(resolve => setTimeout(resolve, 800));
    
    isFilteringTasks = false;
  }

  // Función para refrescar actividad
  async function refreshActivity() {
    isRefreshingActivity = true;
    
    try {
      // Aquí podrías hacer una llamada específica a la API para recargar solo las actividades
      await loadDashboardData();
    } catch (err) {
      console.error('Error al refrescar actividades:', err);
    } finally {
      isRefreshingActivity = false;
    }
  }

  // Función para refrescar tareas
  async function refreshTasks() {
    isRefreshingTasks = true;
    
    try {
      // Aquí podrías hacer una llamada específica a la API para recargar solo las tareas
      await loadDashboardData();
    } catch (err) {
      console.error('Error al refrescar tareas:', err);
    } finally {
      isRefreshingTasks = false;
    }
  }

  // Función para calcular progreso por rango de tiempo
  function calculateTimeRangeProgress(completedTasks, range) {
    const today = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const data = [];
    
    if (!completedTasks || !Array.isArray(completedTasks)) {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
          count: 0
        });
      }
      return data;
    }
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayTasks = completedTasks.filter(task => {
        if (!task || !task.completedAt) return false;
        try {
          const taskDate = new Date(task.completedAt);
          return taskDate.toDateString() === date.toDateString();
        } catch (error) {
          return false;
        }
      }).length;
      
      data.push({
        date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        count: dayTasks
      });
    }
    
    return data;
  }

  // Función para crear gráfico de prioridades
  function createPriorityChart() {
    if (priorityChart) {
      priorityChart.destroy();
    }
    
    const ctx = priorityCanvas.getContext('2d');
    priorityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Crítica', 'Alta', 'Media', 'Baja'],
        datasets: [{
          label: 'Tareas por Prioridad',
          data: [priorityStats.critical, priorityStats.high, priorityStats.medium, priorityStats.low],
          backgroundColor: [
            'rgba(236, 72, 153, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(34, 197, 94, 0.8)'
          ],
          borderColor: [
            'rgba(236, 72, 153, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(34, 197, 94, 1)'
          ],
          borderWidth: 0,
          borderRadius: 12,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(59, 130, 246, 0.5)',
            borderWidth: 1,
            cornerRadius: 12,
            callbacks: {
              label: function(context) {
                const percentage = priorityStats.total > 0 ? 
                  Math.round((context.parsed.y / priorityStats.total) * 100) : 0;
                return `${context.parsed.y} tareas (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#64748b',
              stepSize: 1,
              font: {
                size: 12,
                family: 'Inter, system-ui, sans-serif'
              }
            },
            grid: {
              color: 'rgba(71, 85, 105, 0.2)',
              drawBorder: false
            }
          },
          x: {
            ticks: {
              color: '#64748b',
              font: {
                size: 12,
                family: 'Inter, system-ui, sans-serif'
              }
            },
            grid: {
              display: false
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    });
  }

  // Función para crear gráfico de estados (donut)
  function createStatusChart() {
    if (statusChart) {
      statusChart.destroy();
    }
    
    const ctx = statusCanvas.getContext('2d');
    statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completadas', 'En Progreso', 'Pendientes', 'En Revisión', 'Bloqueadas'],
        datasets: [{
          data: [statusStats.done, statusStats.inProgress, statusStats.todo, statusStats.review, statusStats.blocked],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 0,
          hoverBorderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#f8fafc',
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 13,
                family: 'Inter, system-ui, sans-serif'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(59, 130, 246, 0.5)',
            borderWidth: 1,
            cornerRadius: 12,
            callbacks: {
              label: function(context) {
                const percentage = statusStats.total > 0 ? 
                  Math.round((context.parsed / statusStats.total) * 100) : 0;
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          duration: 1500
        }
      }
    });
  }

  // Función para crear gráfico de línea temporal
  function createWeeklyChart() {
    if (weeklyChart) {
      weeklyChart.destroy();
    }
    
    const timeRangeData = calculateTimeRangeProgress(
      dashboardData?.completedTasks?.tasks || [], 
      selectedTimeRange
    );
    
    const ctx = weeklyCanvas.getContext('2d');
    weeklyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timeRangeData.map(d => d.date),
        datasets: [{
          label: 'Tareas Completadas',
          data: timeRangeData.map(d => d.count),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(59, 130, 246, 0.5)',
            borderWidth: 1,
            cornerRadius: 12
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#64748b',
              stepSize: 1,
              font: {
                size: 12,
                family: 'Inter, system-ui, sans-serif'
              }
            },
            grid: {
              color: 'rgba(71, 85, 105, 0.2)',
              drawBorder: false
            }
          },
          x: {
            ticks: {
              color: '#64748b',
              maxTicksLimit: selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 6 : 5,
              font: {
                size: 12,
                family: 'Inter, system-ui, sans-serif'
              }
            },
            grid: {
              color: 'rgba(71, 85, 105, 0.1)',
              drawBorder: false
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    });
  }

  // Función para crear gráfico de progreso de proyectos
  function createCompletionChart() {
    if (completionChart) {
      completionChart.destroy();
    }
    
    const projectProgress = dashboardData?.projectProgress?.projects || [];
    const projectNames = projectProgress.map(p => p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name);
    const progressPercentages = projectProgress.map(p => p.progressPercentage);
    
    const ctx = completionCanvas.getContext('2d');
    completionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: projectNames,
        datasets: [{
          label: 'Progreso del Proyecto (%)',
          data: progressPercentages,
          backgroundColor: progressPercentages.map(percentage => {
            if (percentage >= 80) return 'rgba(34, 197, 94, 0.8)';
            if (percentage >= 50) return 'rgba(245, 158, 11, 0.8)';
            if (percentage >= 25) return 'rgba(59, 130, 246, 0.8)';
            return 'rgba(239, 68, 68, 0.8)';
          }),
          borderColor: progressPercentages.map(percentage => {
            if (percentage >= 80) return 'rgba(34, 197, 94, 1)';
            if (percentage >= 50) return 'rgba(245, 158, 11, 1)';
            if (percentage >= 25) return 'rgba(59, 130, 246, 1)';
            return 'rgba(239, 68, 68, 1)';
          }),
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(59, 130, 246, 0.5)',
            borderWidth: 1,
            cornerRadius: 12,
            callbacks: {
              label: function(context) {
                const project = projectProgress[context.dataIndex];
                return [
                  `Progreso: ${context.parsed.x}%`,
                  `Completadas: ${project?.completedTasks || 0}`,
                  `Total: ${project?.totalTasks || 0}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#64748b',
              font: {
                size: 12,
                family: 'Inter, system-ui, sans-serif'
              },
              callback: function(value) {
                return value + '%';
              }
            },
            grid: {
              color: 'rgba(71, 85, 105, 0.2)',
              drawBorder: false
            }
          },
          y: {
            ticks: {
              color: '#64748b',
              font: {
                size: 12,
                family: 'Inter, system-ui, sans-serif'
              }
            },
            grid: {
              display: false
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart'
        }
      }
    });
  }

  // Función para actualizar todos los gráficos
  function updateCharts() {
    if (dashboardData) {
      try {
        const pendingTasks = dashboardData.pendingTasks?.tasks || [];
        const completedTasks = dashboardData.completedTasks?.tasks || [];
        const allTasks = [...pendingTasks, ...completedTasks];

        priorityStats = calculatePriorityStats(pendingTasks);
        statusStats = calculateStatusStats(allTasks);
        
        // Agregar las tareas completadas manualmente al conteo
        statusStats.done += completedTasks.length;
        statusStats.total = pendingTasks.length + completedTasks.length;
        
        const totalTasks = allTasks.length;
        const completedCount = completedTasks.length;
        completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

        // Recrear gráficos siempre, sin esperar filtros
        setTimeout(() => {
          if (priorityCanvas) createPriorityChart();
          if (statusCanvas) createStatusChart();
          if (weeklyCanvas) createWeeklyChart();
          if (completionCanvas) createCompletionChart();
        }, 100);
      } catch (error) {
        console.error('Error updating charts:', error);
      }
    }
  }

  // Función para manejar cambio de filtros
  function handleFilterChange() {
    updateCharts();
  }

  // Función para calcular el porcentaje de un valor
  function getPercentage(value, total) {
    return total > 0 ? Math.round((value / total) * 100) : 0;
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
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const userString = localStorage.getItem('user');
      if (userString) {
        userData = JSON.parse(userString);
      }
      
      const dashboardResponse = await api.get('/dashboard');
      const response = await api.get(`/projects/owner/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      dashboardData = {
        ...dashboardResponse.data,
        projects: response.data
      };

      // Actualizar opciones de proyectos para filtros
      projectOptions = [
        { id: 'all', name: 'Todos los proyectos' },
        ...(dashboardData?.activeProjects?.projects || []).map(p => ({
          id: p.id.toString(),
          name: p.name
        }))
      ];

      updateCharts();
      
      console.log('Dashboard data loaded successfully:', dashboardData);
      isLoading = false;
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
      isLoading = false;
      
      if (err.response) {
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
        error = 'No se pudo conectar con el servidor.';
      } else {
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

  // Actualizar gráficos cuando cambien los datos del dashboard
  $: if (dashboardData) {
    updateCharts();
  }

  // Actualizar gráficos cuando cambien los filtros
  $: if (selectedTimeRange || selectedProject || selectedPriority) {
    handleFilterChange();
  }

  // Manejar cambios en filtros de actividad
  $: if (selectedActivityFilter && dashboardData) {
    handleActivityFilterChange();
  }

  // Manejar cambios en filtros de tareas
  $: if ((selectedTaskPriorityFilter || selectedTaskStatusFilter) && dashboardData) {
    handleTaskFilterChange();
  }
</script>

<div class="dashboard-container">
  <!-- Barra lateral moderna -->
  <aside class="sidebar">
    <div class="logo">
      <div class="logo-icon">
        <svg width="32" height="32" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="25" cy="25" r="18" stroke="currentColor" stroke-width="2.5" />
          <path d="M16 25L22 31L34 19" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="logo-text">
        <span class="app-name">Task<span class="highlight">Master</span></span>
        <span class="app-version">Pro</span>
      </div>
    </div>
    
    <nav class="menu">
      <div class="menu-section">
        <span class="section-title">Principal</span>
        <a href="#inicio" class="menu-item active" on:click|preventDefault={() => onNavigate('/principal')}>
          <div class="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          </div>
          <span>Dashboard</span>
        </a>
        <a href="#proyectos" class="menu-item" on:click|preventDefault={() => onNavigate('/proyectos')}>
          <div class="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span>Proyectos</span>
        </a>
        <a href="#tareas" class="menu-item" on:click|preventDefault={() => onNavigate('/tareas')}>
          <div class="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <span>Tareas</span>
        </a>
      </div>
      
      <div class="menu-section">
        <span class="section-title">Colaboración</span>
        <a href="#" class="menu-item" on:click|preventDefault={handleOpenMembersModal}>
          <div class="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span>Equipo</span>
        </a>
        <a href="#perfil" class="menu-item" on:click|preventDefault={() => onNavigate('/perfil')}>
          <div class="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span>Perfil</span>
        </a>
      </div>
    </nav>
    
    <div class="sidebar-footer">
      <button on:click={handleLogout} class="logout-btn">
        <div class="menu-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </div>
        <span>Cerrar Sesión</span>
      </button>
    </div>
  </aside>
  
  <!-- Contenido principal moderno -->
  <main class="main-content">
    <!-- Cabecera moderna -->
    <header class="header">
      <div class="header-left">
        <div class="welcome">
          <h1>Buenas {today.getHours() < 12 ? 'días' : today.getHours() < 19 ? 'tardes' : 'noches'}, 
            <span class="user-name">{userData.firstName}</span> 
            <span class="wave">👋</span>
          </h1>
          <p class="date">{dateString}</p>
        </div>
      </div>
      
      <div class="header-right">
        <div class="header-actions">
          <div class="user-profile" on:click={() => onNavigate('/perfil')}>
            <div class="user-avatar">
              <span>{getInitials(userData.firstName, userData.lastName)}</span>
            </div>
            <div class="user-info" on:click={() => onNavigate('/perfil')}>
              <span class="user-name">{userData.firstName} {userData.lastName}</span>
              <span class="user-role">Administrador</span>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Sistema de Tabs -->
    <div class="tabs-container">
      <div class="tabs-header">
        <div class="tabs-nav">
          <button 
            class="tab-button {activeTab === 'dashboard' ? 'active' : ''}"
            on:click={() => changeTab('dashboard')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="9"/>
              <rect x="14" y="3" width="7" height="5"/>
              <rect x="14" y="12" width="7" height="9"/>
              <rect x="3" y="16" width="7" height="5"/>
            </svg>
            <span>Dashboard</span>
            <div class="tab-indicator"></div>
          </button>
          
          <button 
            class="tab-button {activeTab === 'projects' ? 'active' : ''}"
            on:click={() => changeTab('projects')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Proyectos Activos</span>
            <div class="tab-indicator"></div>
          </button>
          
          <button 
            class="tab-button {activeTab === 'activity' ? 'active' : ''}"
            on:click={() => changeTab('activity')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
            </svg>
            <span>Actividad Reciente</span>
            <div class="tab-indicator"></div>
          </button>
          
          <button 
            class="tab-button {activeTab === 'tasks' ? 'active' : ''}"
            on:click={() => changeTab('tasks')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>Tareas Pendientes</span>
            <div class="tab-indicator"></div>
          </button>
        </div>
        
        <!-- Panel de filtros moderno (solo visible en tab dashboard) -->
        {#if activeTab === 'dashboard'}
        <div class="filters-right">
          <div class="filter-group">
            <select bind:value={selectedTimeRange} class="filter-select">
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
          </div>
          
          <div class="filter-group">
            <select bind:value={selectedProject} class="filter-select">
              {#each projectOptions as project}
                <option value={project.id}>{project.name}</option>
              {/each}
            </select>
          </div>
          
          <div class="filter-group">
            <select bind:value={selectedPriority} class="filter-select">
              <option value="all">Todas las prioridades</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
          
          <button class="refresh-btn" on:click={loadDashboardData}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23,4 23,10 17,10"/>
              <polyline points="1,20 1,14 7,14"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            Actualizar
          </button>
        </div>
        {/if}
      </div>
    </div>
    
    <!-- Contenido del dashboard -->
    <div class="dashboard-content">
      {#if isLoading}
        <div class="loading-state">
          <div class="loading-spinner">
            <div class="spinner-circle"></div>
          </div>
          <p>Cargando datos del dashboard...</p>
        </div>
      {:else if error}
        <div class="error-state">
          <div class="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3>Error al cargar los datos</h3>
          <p>{error}</p>
          <button class="retry-btn" on:click={loadDashboardData}>Reintentar</button>
        </div>
      {:else if dashboardData}
        
        <!-- Tab 1: Dashboard Analytics -->
        {#if activeTab === 'dashboard'}
        <div class="tab-content dashboard-tab">
          <!-- Métricas principales con diseño moderno -->
          <div class="metrics-grid">
            <div class="metric-card projects">
              <div class="metric-header">
                <div class="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div class="metric-trend">
                  <span class="trend-value">+12%</span>
                </div>
              </div>
              <div class="metric-content">
                <h3 class="metric-value">{dashboardData.activeProjects.count}</h3>
                <p class="metric-label">Proyectos Activos</p>
              </div>
            </div>
            
            <div class="metric-card tasks">
              <div class="metric-header">
                <div class="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <div class="metric-trend">
                  <span class="trend-value">+8%</span>
                </div>
              </div>
              <div class="metric-content">
                <h3 class="metric-value">{dashboardData.pendingTasks.count}</h3>
                <p class="metric-label">Tareas Pendientes</p>
              </div>
            </div>
            
            <div class="metric-card completed">
              <div class="metric-header">
                <div class="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                  </svg>
                </div>
                <div class="metric-trend">
                  <span class="trend-value">+24%</span>
                </div>
              </div>
              <div class="metric-content">
                <h3 class="metric-value">{dashboardData.completedTasks.count}</h3>
                <p class="metric-label">Completadas</p>
              </div>
            </div>
            
            <div class="metric-card efficiency">
              <div class="metric-header">
                <div class="metric-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                  </svg>
                </div>
                <div class="metric-trend">
                  <span class="trend-value">+5%</span>
                </div>
              </div>
              <div class="metric-content">
                <h3 class="metric-value">{completionRate}%</h3>
                <p class="metric-label">Eficiencia</p>
              </div>
            </div>
          </div>
          
          <!-- Gráficos principales con diseño moderno -->
          <div class="charts-grid">
            <div class="chart-card priority-chart">
              <div class="chart-header">
                <h3 class="chart-title">Distribución por Prioridad</h3>
                <div class="chart-actions">
                  <button class="chart-action">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="chart-container">
                <canvas bind:this={priorityCanvas}></canvas>
              </div>
            </div>
            
            <div class="chart-card status-chart">
              <div class="chart-header">
                <h3 class="chart-title">Estado de Tareas</h3>
                <div class="chart-actions">
                  <button class="chart-action">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="chart-container">
                <canvas bind:this={statusCanvas}></canvas>
              </div>
            </div>
          </div>
          
          <!-- Gráficos temporales modernos -->
          <div class="charts-grid">
            <div class="chart-card timeline-chart">
              <div class="chart-header">
                <h3 class="chart-title">Productividad - {selectedTimeRange === '7d' ? 'Últimos 7 días' : selectedTimeRange === '30d' ? 'Últimos 30 días' : 'Últimos 90 días'}</h3>
                <div class="chart-actions">
                  <button class="chart-action">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/>
                      <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="chart-container">
                <canvas bind:this={weeklyCanvas}></canvas>
              </div>
            </div>
            
            <div class="chart-card progress-chart">
              <div class="chart-header">
                <h3 class="chart-title">Progreso de Proyectos</h3>
                <div class="chart-actions">
                  <button class="chart-action">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 20V10M12 20V4M6 20v-6"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="chart-container">
                <canvas bind:this={completionCanvas}></canvas>
              </div>
            </div>
          </div>
        </div>
        {/if}
        
        <!-- Tab 2: Proyectos Activos -->
        {#if activeTab === 'projects'}
        <div class="tab-content projects-tab">
          <div class="tab-header">
            <div class="tab-title">
              <h2>Proyectos Activos</h2>
              <p>Gestiona y supervisa todos tus proyectos en curso</p>
            </div>
            <button class="create-project-btn" on:click|preventDefault={() => onNavigate('/crear-proyecto')}>
              <div class="create-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <span>Nuevo Proyecto</span>
            </button>
          </div>
          
          <div class="projects-grid">
            {#each dashboardData.activeProjects.projects as project}
              <div class="project-card">
                <div class="project-header">
                  <div class="project-status">
                    <span class={`status-badge ${project.status.toLowerCase()}`}>{project.status === 'active' ? 'Activo' : project.status}</span>
                  </div>
                  <div class="project-menu">
                    <button class="menu-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="19" cy="12" r="1"/>
                        <circle cx="5" cy="12" r="1"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div class="project-content">
                  <h3 class="project-name">{project.name}</h3>
                  <p class="project-description">{project.description || 'Sin descripción disponible'}</p>
                  
                  <div class="project-stats">
                    <div class="stat-item">
                      <div class="stat-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M9 11l3 3L22 4"/>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                      </div>
                      <span>{project.taskCount} tareas</span>
                    </div>
                    <div class="stat-item">
                      <div class="stat-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </div>
                      <span>{project.memberCount} miembros</span>
                    </div>
                  </div>
                  
                  <div class="progress-section">
                    <div class="progress-info">
                      <span class="progress-label">Progreso</span>
                      <span class="progress-percentage">75%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: 75%;"></div>
                    </div>
                  </div>
                </div>
                
                <div class="project-footer">
                  <div class="project-owner">
                    <div class="owner-avatar">
                      <span>{getInitials(project.owner.firstName, project.owner.lastName)}</span>
                    </div>
                    <div class="owner-info">
                      <span class="owner-name">{project.owner.firstName} {project.owner.lastName}</span>
                      <span class="owner-role">Propietario</span>
                    </div>
                  </div>
                  
                  <div class="project-actions">
                  
                    <button class="action-btn edit" on:click|stopPropagation={() => handleEditProject(project)} title="Editar proyecto">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="action-btn add-member" on:click|stopPropagation={() => handleAddMember(project)} title="Añadir miembro">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="10" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
        {/if}
        
        <!-- Tab 3: Actividad Reciente -->
        {#if activeTab === 'activity'}
        <div class="tab-content activity-tab">
          <div class="tab-header">
            <div class="tab-title">
              <h2>Actividad Reciente</h2>
              <p>Mantente al día con las últimas actualizaciones del equipo</p>
            </div>
            <div class="activity-filters">
              <select class="filter-select" bind:value={selectedActivityFilter}>
                <option value="all">Todas las actividades</option>
                <option value="tasks">Solo tareas</option>
                <option value="comments">Solo comentarios</option>
                <option value="attachments">Solo archivos</option>
              </select>
              
              <button class="refresh-btn-secondary" on:click={refreshActivity} disabled={isRefreshingActivity}>
                {#if isRefreshingActivity}
                  <div class="mini-spinner"></div>
                {:else}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23,4 23,10 17,10"/>
                    <polyline points="1,20 1,14 7,14"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                {/if}
                Actualizar
              </button>
            </div>
          </div>
          
          <!-- Loading state para filtros de actividad -->
          {#if isFilteringActivity}
            <div class="filter-loading-state">
              <div class="filter-spinner">
                <div class="spinner-circle-small"></div>
              </div>
              <p>Aplicando filtros...</p>
            </div>
          {:else}
            <div class="activity-timeline">
              {#each filterActivities(dashboardData.recentActivity.activities) as activity, index}
                <div class="timeline-item">
                  <div class="timeline-marker">
                    <div class="activity-avatar">
                      <div class="activity-icon {activity.type}">
                        {#if activity.type === 'task_created'}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        {:else if activity.type === 'comment_added'}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                        {:else if activity.type === 'attachment_added'}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
                          </svg>
                        {:else}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23,4 23,10 17,10"/>
                            <polyline points="1,20 1,14 7,14"/>
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                          </svg>
                        {/if}
                      </div>
                    </div>
                  </div>
                  
                  <div class="timeline-content">
                    <div class="activity-card">
                      <div class="activity-header">
                        <div class="activity-user">
                          <div class="user-avatar">
                            <span>{getInitials(activity.userName.split(' ')[0], activity.userName.split(' ')[1] || '')}</span>
                          </div>
                          <div class="user-details">
                            <span class="user-name">{activity.userName}</span>
                            <span class="activity-time">{getRelativeTime(activity.timestamp)}</span>
                          </div>
                        </div>
                        <div class="activity-type">
                          <span class="type-badge {activity.type}">
                            {activity.type === 'task_created' ? 'Tarea creada' : 
                             activity.type === 'comment_added' ? 'Comentario' : 
                             activity.type === 'attachment_added' ? 'Archivo adjunto' : 'Actualización'}
                          </span>
                        </div>
                      </div>
                      
                      <div class="activity-description">
                        <p>
                          <span class="activity-action">
                            {activity.type === 'task_created' ? 'creó la tarea' : 
                             activity.type === 'comment_added' ? 'comentó en' : 
                             activity.type === 'attachment_added' ? 'adjuntó un archivo a' : 'actualizó'}
                          </span>
                          <span class="task-link">{activity.type === 'task_created' || activity.type === 'task_updated' ? activity.title : activity.taskTitle}</span>
                        </p>
                      </div>
                      
                      <div class="activity-footer">
                        <div class="project-info">
                          <div class="project-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                          </div>
                          <span class="project-name">{activity.projectName}</span>
                        </div>
                        <button class="view-detail-btn">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 17L17 7"/>
                            <path d="M7 7h10v10"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        {/if}
        
        <!-- Tab 4: Tareas Pendientes -->
        {#if activeTab === 'tasks'}
        <div class="tab-content tasks-tab">
          <div class="tab-header">
            <div class="tab-title">
              <h2>Tareas Pendientes</h2>
              <p>Organiza y prioriza tu trabajo pendiente</p>
            </div>
            <div class="tasks-filters">
              <select class="filter-select" bind:value={selectedTaskPriorityFilter}>
                <option value="all">Todas las prioridades</option>
                <option value="critical">Crítica</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
   
              
              <button class="refresh-btn-secondary" on:click={refreshTasks} disabled={isRefreshingTasks}>
                {#if isRefreshingTasks}
                  <div class="mini-spinner"></div>
                {:else}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23,4 23,10 17,10"/>
                    <polyline points="1,20 1,14 7,14"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                {/if}
                Actualizar
              </button>
            </div>
          </div>
          
          <!-- Loading state para filtros de tareas -->
          {#if isFilteringTasks}
            <div class="filter-loading-state">
              <div class="filter-spinner">
                <div class="spinner-circle-small"></div>
              </div>
              <p>Aplicando filtros...</p>
            </div>
          {:else}
            <div class="tasks-board">
              <div class="board-columns">
                <!-- Columna: Por hacer -->
                <div class="board-column todo">
                  <div class="column-header">
                    <div class="column-title">
                      <div class="column-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                      </div>
                      <span>Por hacer</span>
                      <div class="task-count">{filterBoardTasks(dashboardData.pendingTasks.tasks.filter(t => t.status.toLowerCase() === 'todo')).length}</div>
                    </div>
                  </div>
                  <div class="column-tasks">
                    {#each filterBoardTasks(dashboardData.pendingTasks.tasks.filter(t => t.status.toLowerCase() === 'todo')) as task}
                      <div class="task-card-board {getPriorityClass(task.priority)}" on:click={() => handleTaskClick(task.id)}>
                        <div class="task-priority-indicator"></div>
                        <div class="task-header-board">
                          <div class="task-priority-label">
                            <span class={`priority-badge ${getPriorityClass(task.priority)}`}>{translatePriority(task.priority)}</span>
                          </div>
                          <div class="task-menu">
                            <button class="task-menu-btn">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="19" cy="12" r="1"/>
                                <circle cx="5" cy="12" r="1"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div class="task-content-board">
                          <h4 class="task-title-board">{task.title}</h4>
                          <div class="task-meta-board">
                            <div class="meta-item-board">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                              </svg>
                              <span>{task.project.name}</span>
                            </div>
                            <div class="meta-item-board">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              <span>
                                {#if task.dueDate}
                                  {new Date(task.dueDate).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})}
                                {:else}
                                  Sin fecha
                                {/if}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div class="task-footer-board">
                          {#if task.assignee}
                            <div class="task-assignee-board">
                              <div class="assignee-avatar-board">
                                <span>{getInitials(task.assignee.firstName, task.assignee.lastName)}</span>
                              </div>
                              <span class="assignee-name-board">{task.assignee.firstName}</span>
                            </div>
                          {:else}
                            <div class="task-assignee-board unassigned">
                              <div class="assignee-avatar-board unassigned">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                              </div>
                              <span class="assignee-name-board">Sin asignar</span>
                            </div>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
                
                <!-- Columna: En progreso -->
                <div class="board-column in-progress">
                  <div class="column-header">
                    <div class="column-title">
                      <div class="column-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                      </div>
                      <span>En progreso</span>
                      <div class="task-count">{filterBoardTasks(dashboardData.pendingTasks.tasks.filter(t => t.status.toLowerCase() === 'in progress')).length}</div>
                    </div>
                  </div>
                  <div class="column-tasks">
                    {#each filterBoardTasks(dashboardData.pendingTasks.tasks.filter(t => t.status.toLowerCase() === 'in progress')) as task}
                      <div class="task-card-board {getPriorityClass(task.priority)}" on:click={() => handleTaskClick(task.id)}>
                        <div class="task-priority-indicator"></div>
                        <div class="task-header-board">
                          <div class="task-priority-label">
                            <span class={`priority-badge ${getPriorityClass(task.priority)}`}>{translatePriority(task.priority)}</span>
                          </div>
                          <div class="task-menu">
                            <button class="task-menu-btn">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="19" cy="12" r="1"/>
                                <circle cx="5" cy="12" r="1"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div class="task-content-board">
                          <h4 class="task-title-board">{task.title}</h4>
                          <div class="task-meta-board">
                            <div class="meta-item-board">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                              </svg>
                              <span>{task.project.name}</span>
                            </div>
                            <div class="meta-item-board">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              <span>
                                {#if task.dueDate}
                                  {new Date(task.dueDate).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})}
                                {:else}
                                  Sin fecha
                                {/if}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div class="task-footer-board">
                          {#if task.assignee}
                            <div class="task-assignee-board">
                              <div class="assignee-avatar-board">
                                <span>{getInitials(task.assignee.firstName, task.assignee.lastName)}</span>
                              </div>
                              <span class="assignee-name-board">{task.assignee.firstName}</span>
                            </div>
                          {:else}
                            <div class="task-assignee-board unassigned">
                              <div class="assignee-avatar-board unassigned">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                              </div>
                              <span class="assignee-name-board">Sin asignar</span>
                            </div>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
                
                <!-- Columna: En revisión -->
                <div class="board-column review">
                  <div class="column-header">
                    <div class="column-title">
                      <div class="column-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M9 12l2 2 4-4"/>
                          <path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/>
                          <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"/>
                        </svg>
                      </div>
                      <span>En revisión</span>
                      <div class="task-count">{filterBoardTasks(dashboardData.pendingTasks.tasks.filter(t => t.status.toLowerCase() === 'review')).length}</div>
                    </div>
                  </div>
                  <div class="column-tasks">
                    {#each filterBoardTasks(dashboardData.pendingTasks.tasks.filter(t => t.status.toLowerCase() === 'review')) as task}
                      <div class="task-card-board {getPriorityClass(task.priority)}" on:click={() => handleTaskClick(task.id)}>
                        <div class="task-priority-indicator"></div>
                        <div class="task-header-board">
                          <div class="task-priority-label">
                            <span class={`priority-badge ${getPriorityClass(task.priority)}`}>{translatePriority(task.priority)}</span>
                          </div>
                          <div class="task-menu">
                            <button class="task-menu-btn">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="19" cy="12" r="1"/>
                                <circle cx="5" cy="12" r="1"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div class="task-content-board">
                          <h4 class="task-title-board">{task.title}</h4>
                          <div class="task-meta-board">
                            <div class="meta-item-board">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                              </svg>
                              <span>{task.project.name}</span>
                            </div>
                            <div class="meta-item-board">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              <span>
                                {#if task.dueDate}
                                  {new Date(task.dueDate).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})}
                                {:else}
                                  Sin fecha
                                {/if}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div class="task-footer-board">
                          {#if task.assignee}
                            <div class="task-assignee-board">
                              <div class="assignee-avatar-board">
                                <span>{getInitials(task.assignee.firstName, task.assignee.lastName)}</span>
                              </div>
                              <span class="assignee-name-board">{task.assignee.firstName}</span>
                            </div>
                          {:else}
                            <div class="task-assignee-board unassigned">
                              <div class="assignee-avatar-board unassigned">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                              </div>
                              <span class="assignee-name-board">Sin asignar</span>
                            </div>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>
        {/if}
        
      {/if}
    </div>
  </main>

  <!-- Modales (mantenemos la funcionalidad original) -->
  {#if showTaskDetail && selectedTaskId && typeof onOpenTask !== 'function'}
    <div style="z-index:2000;">
      <svelte:component this={DetalleTarea} 
        taskId={selectedTaskId} 
        onClose={handleCloseTaskDetail}
        onSuccess={() => {
          handleCloseTaskDetail();
          loadDashboardData();
        }}
      />
    </div>
  {/if}
  
  {#if showMembersModal && selectedProjectId}
    <div style="z-index:2000;">
      <ProjectMembersModal 
        projectId={selectedProjectId} 
        onClose={handleCloseMembersModal}
        onSuccess={() => {
          handleCloseMembersModal();
          loadDashboardData();
        }}
      />
    </div>
  {/if}

  <!-- Nuevos modales para proyectos -->
  {#if showEditProjectModal && selectedProjectForEdit}
    <div style="z-index:2001;">
      <EditProjectModal
        projectId={selectedProjectForEdit.id}
        onClose={handleCloseEditProject}
        onSuccess={() => {
          handleCloseEditProject();
          handleProjectSuccess();
        }}
      />
    </div>
  {/if}

  {#if showAddMemberModal && selectedProjectForEdit}
    <div style="z-index:2001;">
      <AddMemberModal
        projectId={selectedProjectForEdit.id}
        onClose={handleCloseAddMember}
        onSuccess={() => {
          handleCloseAddMember();
          handleProjectSuccess();
        }}
      />
    </div>
  {/if}
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #f8fafc;
    overflow-x: hidden;
  }
  
  .dashboard-container {
    display: flex;
    min-height: 100vh;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
  
  /* Sidebar moderno (mantenemos el estilo original) */
  .sidebar {
    width: 280px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(71, 85, 105, 0.2);
    display: flex;
    flex-direction: column;
    padding: 24px 0;
    position: relative;
    z-index: 10;
  }
  
  .sidebar::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
  
  .logo {
    display: flex;
    align-items: center;
    padding: 0 24px;
    margin-bottom: 40px;
    gap: 12px;
  }
  
  .logo-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .logo-text {
    display: flex;
    flex-direction: column;
  }
  
  .app-name {
    font-size: 20px;
    font-weight: 700;
    color: #f8fafc;
  }
  
  .highlight {
    color: #3b82f6;
  }
  
  .app-version {
    font-size: 11px;
    font-weight: 500;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .menu {
    flex: 1;
    padding: 0 24px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  
  .menu-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .section-title {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    padding-left: 12px;
  }
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 12px;
    color: #cbd5e1;
    text-decoration: none;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    gap: 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    width: 100%;
    text-align: left;
  }
  
  .menu-item:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #f8fafc;
    transform: translateX(4px);
  }
  
  .menu-item.active {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%);
    color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  }
  
  .menu-item.active::before {
    content: '';
    position: absolute;
    left: -24px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 24px;
    background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 0 2px 2px 0;
  }
  
  .menu-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .sidebar-footer {
    padding: 0 24px;
    margin-top: auto;
  }
  
  .logout-btn {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    gap: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
    transform: translateY(-1px);
  }
  
  /* Main content moderno */
  .main-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    background: transparent;
  }
  
  /* Header moderno */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(71, 85, 105, 0.2);
    border-radius: 20px;
    padding: 20px 24px;
  }
  
  .header-left .welcome h1 {
    font-size: 28px;
    font-weight: 600;
    margin: 0;
    background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .user-name {
    color: #3b82f6;
    font-weight: 700;
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
    color: #64748b;
    margin: 8px 0 0;
    font-size: 14px;
    font-weight: 500;
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .user-profile:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: white;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
    text-align: left;
  }
  
  .user-info .user-name {
    font-size: 14px;
    font-weight: 600;
    color: #f8fafc;
  }
  
  .user-role {
    font-size: 12px;
    color: #64748b;
  }
  
  /* Sistema de Tabs */
  .tabs-container {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(71, 85, 105, 0.2);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 32px;
  }
  
  .tabs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .tabs-nav {
    display: flex;
    gap: 8px;
    background: rgba(30, 41, 59, 0.5);
    padding: 6px;
    border-radius: 16px;
    border: 1px solid rgba(71, 85, 105, 0.2);
  }
  
  .tab-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: transparent;
    border: none;
    border-radius: 12px;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .tab-button:hover {
    color: #f8fafc;
    background: rgba(59, 130, 246, 0.1);
  }
  
  .tab-button.active {
    color: #f8fafc;
    background: rgba(59, 130, 246, 0.2);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .tab-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #3b82f6;
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }
  
  .tab-button.active .tab-indicator {
    transform: scaleX(1);
  }
  
  .filters-right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .filter-select {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 12px;
    padding: 12px 16px;
    color: #f8fafc;
    font-size: 14px;
    font-weight: 500;
    min-width: 160px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
  }
  
  .filter-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .filter-select:hover {
    border-color: rgba(59, 130, 246, 0.5);
  }
  
  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .refresh-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }
  
  .refresh-btn:active {
    transform: translateY(0);
  }

  /* Nuevos estilos para botones de actualización secundarios */
  .refresh-btn-secondary {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 12px;
    padding: 12px 16px;
    color: #f8fafc;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
  }
  
  .refresh-btn-secondary:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
    transform: translateY(-1px);
  }
  
  .refresh-btn-secondary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .mini-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(59, 130, 246, 0.3);
    border-radius: 50%;
    border-top-color: #3b82f6;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Estados de carga para filtros */
  .filter-loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    text-align: center;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(71, 85, 105, 0.2);
    border-radius: 16px;
    padding: 32px;
    margin: 20px 0;
  }
  
  .filter-spinner {
    margin-bottom: 16px;
  }
  
  .spinner-circle-small {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(59, 130, 246, 0.3);
    border-radius: 50%;
    border-top-color: #3b82f6;
    animation: spin 1s linear infinite;
  }
  
  .filter-loading-state p {
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    margin: 0;
  }
  
  /* Dashboard content */
  .dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  
  /* Tab Content Styles */
  .tab-content {
    animation: fadeInUp 0.5s ease-out;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .tab-title h2 {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 4px;
    background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .tab-title p {
    color: #64748b;
    margin: 0;
    font-size: 14px;
    font-weight: 500;
  }

  /* Nuevos estilos para filtros de actividad y tareas */
  .activity-filters, .tasks-filters {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .activity-filters .filter-select, .tasks-filters .filter-select {
    min-width: 140px;
  }
  
  /* Estados de carga y error */
  .loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(71, 85, 105, 0.2);
    border-radius: 20px;
    padding: 48px;
  }
  
  .loading-spinner {
    margin-bottom: 24px;
  }
  
  .spinner-circle {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(59, 130, 246, 0.3);
    border-radius: 50%;
    border-top-color: #3b82f6;
    animation: spin 1s linear infinite;
  }
  
  .loading-state p {
    color: #64748b;
    font-size: 16px;
    font-weight: 500;
    margin: 0;
  }
  
  .error-icon {
    color: #ef4444;
    margin-bottom: 16px;
  }
  
  .error-state h3 {
    color: #f8fafc;
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px;
  }
  
  .error-state p {
    color: #64748b;
    margin: 0 0 24px;
    font-size: 14px;
  }
  
  .retry-btn {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .retry-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
  }
  
  /* Métricas modernas */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
  }
  
  .metric-card {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(71, 85, 105, 0.2);
    border-radius: 20px;
    padding: 24px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .metric-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--accent-color) 50%, transparent 100%);
  }
  
  .metric-card.projects {
    --accent-color: #3b82f6;
  }
  
  .metric-card.tasks {
    --accent-color: #8b5cf6;
  }
  
  .metric-card.completed {
    --accent-color: #10b981;
  }
  
  .metric-card.efficiency {
    --accent-color: #f59e0b;
  }
  
  .metric-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(var(--accent-color-rgb), 0.3);
  }
  
  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .metric-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(var(--accent-color-rgb), 0.2) 0%, rgba(var(--accent-color-rgb), 0.1) 100%);
    color: var(--accent-color);
  }
  
  .metric-card.projects .metric-icon {
    --accent-color-rgb: 59, 130, 246;
  }
  
  .metric-card.tasks .metric-icon {
    --accent-color-rgb: 139, 92, 246;
  }
  
  .metric-card.completed .metric-icon {
    --accent-color-rgb: 16, 185, 129;
  }
  
  .metric-card.efficiency .metric-icon {
    --accent-color-rgb: 245, 158, 11;
  }
  
  .metric-trend {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .metric-content {
    display: flex;
    flex-direction: column;
  }
  
  .metric-value {
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 4px;
    color: #f8fafc;
  }
  
  .metric-label {
    color: #64748b;
    margin: 0;
    font-size: 14px;
    font-weight: 500;
  }
  
  /* Gráficos modernos */
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
  }
  
  .chart-card {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(71, 85, 105, 0.2);
    border-radius: 20px;
    padding: 24px;
    transition: all 0.3s ease;
  }
  
  .chart-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .chart-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #f8fafc;
  }
  
  .chart-actions {
    display: flex;
    gap: 8px;
  }
  
  .chart-action {
    width: 32px;
    height: 32px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .chart-action:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }
  
  .chart-container {
    height: 300px;
    position: relative;
  }
  
  .chart-container canvas {
    max-height: 100%;
    border-radius: 12px;
  }
  
  /* Proyectos Tab Styles */
  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 24px;
  }
  
  .project-card {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(71, 85, 105, 0.2);
    border-radius: 20px;
    padding: 24px;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .project-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(59, 130, 246, 0.3);
  }
  
  .project-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .status-badge {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
  }
  
  .status-badge.active {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
  
  .menu-btn {
    width: 32px;
    height: 32px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .menu-btn:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }
  
  .project-content {
    margin-bottom: 20px;
  }
  
  .project-name {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px;
    color: #f8fafc;
  }
  
  .project-description {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 16px;
    line-height: 1.5;
  }
  
  .project-stats {
    display: flex;
    gap: 20px;
    margin-bottom: 16px;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #64748b;
  }
  
  .stat-icon {
    flex-shrink: 0;
  }
  
  .progress-section {
    margin-bottom: 16px;
  }
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .progress-label {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }
  
  .progress-percentage {
    font-size: 13px;
    color: #f8fafc;
    font-weight: 600;
  }
  
  .progress-bar {
    height: 6px;
    background: rgba(71, 85, 105, 0.3);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  
  .project-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .project-owner {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .owner-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 12px;
    color: white;
  }
  
  .owner-info {
    display: flex;
    flex-direction: column;
  }
  
  .owner-name {
    font-size: 14px;
    font-weight: 500;
    color: #f8fafc;
  }
  
  .owner-role {
    font-size: 12px;
    color: #64748b;
  }
  
  .project-actions {
    display: flex;
    gap: 8px;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .action-btn.view:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }
  
  .action-btn.edit:hover {
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
    color: #f59e0b;
  }

  .action-btn.add-member:hover {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
    color: #10b981;
  }
  
  .create-project-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .create-project-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  }
  
  .create-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Activity Tab Styles */
  .activity-timeline {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .timeline-item {
    display: flex;
    gap: 16px;
    position: relative;
  }
  
  .timeline-item:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 24px;
    top: 48px;
    bottom: -24px;
    width: 1px;
    background: rgba(71, 85, 105, 0.3);
  }
  
  .timeline-marker {
    flex-shrink: 0;
  }
  
  .activity-avatar {
    position: relative;
    z-index: 1;
  }
  
  .activity-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(71, 85, 105, 0.2);
    background: rgba(15, 23, 42, 0.8);
  }
  
  .activity-icon.task_created {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }
  
  .activity-icon.comment_added {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
    color: #10b981;
  }
  
  .activity-icon.attachment_added {
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
    color: #f59e0b;
  }
  
  .timeline-content {
    flex: 1;
    min-width: 0;
  }
  
  .activity-card {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(71, 85, 105, 0.2);
    border-radius: 16px;
    padding: 20px;
    transition: all 0.3s ease;
  }
  
  .activity-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
    border-color: rgba(59, 130, 246, 0.3);
  }
  
  .activity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .activity-user {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .activity-card .user-avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 12px;
    color: white;
  }
  
  .user-details {
    display: flex;
    flex-direction: column;
  }
  
  .activity-user .user-name {
    font-size: 14px;
    font-weight: 600;
    color: #f8fafc;
  }
  
  .activity-time {
    font-size: 12px;
    color: #64748b;
  }
  
  .activity-type {
    flex-shrink: 0;
  }
  
  .type-badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .type-badge.task_created {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }
  
  .type-badge.comment_added {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
  
  .type-badge.attachment_added {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }
  
  .activity-description {
    margin-bottom: 16px;
  }
  
  .activity-description p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: #cbd5e1;
  }
  
  .activity-action {
    color: #64748b;
  }
  
  .task-link {
    color: #3b82f6;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
  }
  
  .task-link:hover {
    text-decoration: underline;
  }
  
  .activity-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .project-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .project-icon {
    color: #64748b;
  }
  
  .activity-footer .project-name {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }
  
  .view-detail-btn {
    width: 28px;
    height: 28px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .view-detail-btn:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }
  
  /* Tasks Tab Styles */
  .tasks-board {
    width: 100%;
  }
  
  .board-columns {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    min-height: 600px;
  }
  
  .board-column {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(71, 85, 105, 0.2);
    border-radius: 16px;
    padding: 20px;
    min-height: 100%;
  }
  
  .column-header {
    margin-bottom: 20px;
  }
  
  .column-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .column-icon {
    color: #64748b;
  }
  
  .board-column.todo .column-icon {
    color: #8b5cf6;
  }
  
  .board-column.in-progress .column-icon {
    color: #f59e0b;
  }
  
  .board-column.review .column-icon {
    color: #10b981;
  }
  
  .column-title span {
    font-size: 16px;
    font-weight: 600;
    color: #f8fafc;
  }
  
  .task-count {
    background: rgba(71, 85, 105, 0.3);
    color: #cbd5e1;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    margin-left: auto;
  }
  
  .board-column.todo .task-count {
    background: rgba(139, 92, 246, 0.2);
    color: #8b5cf6;
  }
  
  .board-column.in-progress .task-count {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }
  
  .board-column.review .task-count {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
  
  .column-tasks {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .task-card-board {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(71, 85, 105, 0.3);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .task-card-board::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--task-accent, #64748b);
  }
  
  .task-card-board.critical {
    --task-accent: #ec4899;
  }
  
  .task-card-board.high {
    --task-accent: #ef4444;
  }
  
  .task-card-board.medium {
    --task-accent: #f59e0b;
  }
  
  .task-card-board.low {
    --task-accent: #10b981;
  }
  
  .task-card-board:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    border-color: rgba(59, 130, 246, 0.3);
  }
  
  .task-priority-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--task-accent, #64748b);
  }
  
  .task-header-board {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .task-priority-label {
    flex: 1;
  }
  
  .priority-badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .priority-badge.critical {
    background: rgba(236, 72, 153, 0.2);
    color: #ec4899;
  }
  
  .priority-badge.high {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .priority-badge.medium {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }
  
  .priority-badge.low {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
  
  .task-menu {
    flex-shrink: 0;
  }
  
  .task-menu-btn {
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .task-menu-btn:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
  
  .task-content-board {
    margin-bottom: 12px;
  }
  
  .task-title-board {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 8px;
    color: #f8fafc;
    line-height: 1.4;
  }
  
  .task-meta-board {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .meta-item-board {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
  }
  
  .meta-item-board svg {
    flex-shrink: 0;
  }
  
  .task-footer-board {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .task-assignee-board {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .assignee-avatar-board {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 10px;
    color: white;
    flex-shrink: 0;
  }
  
  .assignee-avatar-board.unassigned {
    background: rgba(71, 85, 105, 0.5);
    color: #64748b;
  }
  
  .assignee-name-board {
    font-size: 12px;
    font-weight: 500;
    color: #f8fafc;
  }
  
  .assignee-name-board.unassigned {
    color: #64748b;
    font-style: italic;
  }
  
  .task-assignee-board.unassigned {
    opacity: 0.7;
  }
  
  /* Responsive Design */
  
  /* Large desktops */
  @media (max-width: 1600px) {
    .charts-grid {
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    }
  }
  
  @media (max-width: 1400px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }
    
    .projects-grid {
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    }
    
    .board-columns {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
  }
  
  @media (max-width: 1200px) {
    .sidebar {
      width: 240px;
    }
    
    .metrics-grid {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
    
    .projects-grid {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
  }
  
  /* Tablets */
  @media (max-width: 992px) {
    .header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
      padding: 16px 20px;
    }
    
    .header-left .welcome h1 {
      font-size: 24px;
    }
    
    .header-right {
      justify-content: center;
    }
    
    .tabs-header {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }
    
    .tabs-nav {
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      white-space: nowrap;
      padding: 8px;
    }
    
    .tabs-nav::-webkit-scrollbar {
      display: none;
    }
    
    .filters-right {
      flex-direction: column;
      gap: 12px;
    }
    
    .filter-group {
      width: 100%;
    }
    
    .filter-select {
      min-width: auto;
      width: 100%;
    }
    
    .refresh-btn {
      width: 100%;
      justify-content: center;
    }
    
    .tab-header {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }
    
    .tasks-filters, .activity-filters {
      flex-direction: column;
      gap: 12px;
    }
    
    .tasks-filters .filter-select, .activity-filters .filter-select {
      width: 100%;
      min-width: auto;
    }
    
    .refresh-btn-secondary {
      width: 100%;
      justify-content: center;
    }
    
    .metrics-grid {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .board-columns {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
  
  /* Mobile landscape and small tablets */
  @media (max-width: 768px) {
    .dashboard-container {
      flex-direction: column;
      min-height: 100vh;
    }
    
    .sidebar {
      width: 100%;
      padding: 12px 0;
      order: 2;
      border-right: none;
      border-top: 1px solid rgba(71, 85, 105, 0.2);
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      height: auto;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .logo {
      display: none;
    }
    
    .menu {
      padding: 0 16px;
      gap: 8px;
      flex-direction: row;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .menu::-webkit-scrollbar {
      display: none;
    }
    
    .menu-section {
      display: flex;
      flex-direction: row;
      gap: 8px;
      flex-shrink: 0;
    }
    
    .section-title {
      display: none;
    }
    
    .menu-item {
      padding: 12px;
      min-width: 48px;
      justify-content: center;
      border-radius: 12px;
      flex-shrink: 0;
    }
    
    .menu-item span {
      display: none;
    }
    
    .menu-item.active::before {
      display: none;
    }
    
    .sidebar-footer {
      padding: 0 16px;
      margin-top: 8px;
    }
    
    .logout-btn {
      padding: 8px;
      min-width: 48px;
      justify-content: center;
    }
    
    .logout-btn span {
      display: none;
    }
    
    .main-content {
      padding: 16px;
      padding-bottom: 220px; /* Space for fixed sidebar */
      order: 1;
      overflow-y: auto;
      max-height: calc(100vh - 220px);
    }
    
    .header {
      padding: 16px;
      margin-bottom: 20px;
    }
    
    .header-left .welcome h1 {
      font-size: 20px;
      line-height: 1.3;
    }
    
    .date {
      font-size: 13px;
    }
    
    .tabs-container {
      padding: 16px;
      margin-bottom: 20px;
    }
    
    .tabs-nav {
      gap: 4px;
      padding: 6px;
      flex-wrap: nowrap;
    }
    
    .tab-button {
      padding: 8px 12px;
      font-size: 12px;
      min-width: auto;
      flex-shrink: 0;
    }
    
    .tab-button span {
      display: none;
    }
    
    .tab-button svg {
      width: 18px;
      height: 18px;
    }
    
    .filters-right {
      gap: 8px;
    }
    
    .filter-select {
      padding: 8px 12px;
      font-size: 13px;
    }
    
    .refresh-btn {
      padding: 8px 16px;
      font-size: 13px;
    }
    
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .metric-card {
      padding: 16px;
    }
    
    .metric-icon {
      width: 40px;
      height: 40px;
    }
    
    .metric-value {
      font-size: 24px;
    }
    
    .metric-label {
      font-size: 12px;
    }
    
    .charts-grid {
      gap: 16px;
    }
    
    .chart-container {
      height: 250px;
    }
    
    .chart-card {
      padding: 16px;
    }
    
    .chart-title {
      font-size: 16px;
    }
    
    .projects-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    
    .project-card {
      padding: 16px;
    }
    
    .project-name {
      font-size: 16px;
    }
    
    .activity-timeline {
      gap: 16px;
    }
    
    .timeline-item {
      gap: 12px;
    }
    
    .timeline-item:not(:last-child)::after {
      left: 20px;
    }
    
    .activity-icon {
      width: 40px;
      height: 40px;
    }
    
    .activity-card {
      padding: 16px;
    }
    
    .board-columns {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    
    .board-column {
      padding: 16px;
    }
    
    .user-info {
      display: none;
    }
    
    .activity-filters, .tasks-filters {
      gap: 8px;
    }
    
    .refresh-btn-secondary {
      padding: 8px 12px;
      font-size: 13px;
    }
    
    .create-project-btn {
      padding: 10px 16px;
      font-size: 13px;
    }
  }
  
  /* Mobile portrait */
  @media (max-width: 480px) {
    .main-content {
      padding: 12px;
      padding-bottom: 200px;
      max-height: calc(100vh - 200px);
    }
    
    .header {
      padding: 12px;
      margin-bottom: 16px;
    }
    
    .header-left .welcome h1 {
      font-size: 18px;
    }
    
    .tabs-container {
      padding: 12px;
      margin-bottom: 16px;
    }
    
    .tab-header {
      margin-bottom: 16px;
    }
    
    .tab-title h2 {
      font-size: 18px;
    }
    
    .tab-title p {
      font-size: 13px;
    }
    
    .metrics-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    
    .metric-card, .chart-card, .project-card, .activity-card {
      padding: 14px;
    }
    
    .metric-icon {
      width: 36px;
      height: 36px;
    }
    
    .metric-value {
      font-size: 20px;
    }
    
    .chart-container {
      height: 200px;
    }
    
    .chart-title {
      font-size: 15px;
    }
    
    .timeline-item {
      gap: 10px;
    }
    
    .timeline-item:not(:last-child)::after {
      left: 16px;
    }
    
    .activity-icon {
      width: 32px;
      height: 32px;
    }
    
    .activity-card {
      padding: 14px;
    }
    
    .user-avatar {
      width: 28px;
      height: 28px;
      font-size: 11px;
    }
    
    .board-column {
      padding: 12px;
    }
    
    .task-card-board {
      padding: 12px;
    }
    
    .task-title-board {
      font-size: 13px;
    }
    
    .sidebar {
      max-height: 180px;
    }
    
    .menu {
      gap: 6px;
    }
    
    .menu-item {
      padding: 10px;
      min-width: 44px;
    }
    
    .filter-select {
      padding: 10px;
      font-size: 14px;
    }
    
    .refresh-btn, .refresh-btn-secondary, .create-project-btn {
      padding: 10px 14px;
      font-size: 14px;
    }
  }
  
  /* Very small screens */
  @media (max-width: 375px) {
    .main-content {
      padding: 8px;
    }
    
    .header, .tabs-container {
      padding: 10px;
    }
    
    .header-left .welcome h1 {
      font-size: 16px;
    }
    
    .tab-title h2 {
      font-size: 16px;
    }
    
    .metrics-grid {
      gap: 8px;
    }
    
    .metric-card, .chart-card, .project-card, .activity-card, .board-column, .task-card-board {
      padding: 12px;
    }
    
    .metric-value {
      font-size: 18px;
    }
    
    .chart-container {
      height: 180px;
    }
    
    .activity-icon {
      width: 28px;
      height: 28px;
    }
    
    .user-avatar {
      width: 24px;
      height: 24px;
      font-size: 10px;
    }
    
    .sidebar {
      max-height: 160px;
    }
    
    .menu-item {
      padding: 8px;
      min-width: 40px;
    }
  }
  /* Animaciones adicionales */
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .metric-card, .chart-card, .project-card, .task-card-board {
    animation: slideInUp 0.6s ease-out;
  }
  
  .metric-card:nth-child(1) { animation-delay: 0.1s; }
  .metric-card:nth-child(2) { animation-delay: 0.2s; }
  .metric-card:nth-child(3) { animation-delay: 0.3s; }
  .metric-card:nth-child(4) { animation-delay: 0.4s; }
  
  /* Efectos de glassmorphism mejorados */
  .sidebar, .header, .tabs-container, .metric-card, .chart-card, .project-card, .activity-card, .task-card-board {
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
  }
  
  /* Scrollbar personalizado */
  .main-content::-webkit-scrollbar, .column-tasks::-webkit-scrollbar {
    width: 8px;
  }
  
  .main-content::-webkit-scrollbar-track, .column-tasks::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.3);
    border-radius: 4px;
  }
  
  .main-content::-webkit-scrollbar-thumb, .column-tasks::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 4px;
  }
  
  .main-content::-webkit-scrollbar-thumb:hover, .column-tasks::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.7);
  }
  
  /* Mejoras adicionales para el sistema de tabs */
  .tabs-nav {
    position: relative;
  }
  
  .tabs-nav::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%);
    border-radius: 16px;
    pointer-events: none;
  }
  
  /* Estados hover mejorados */
  .project-card:hover, .activity-card:hover, .task-card-board:hover {
    border-color: rgba(59, 130, 246, 0.4);
  }
  
  /* Transiciones suaves para cambios de estado */
  * {
    transition: border-color 0.3s ease, background-color 0.3s ease, color 0.3s ease, transform 0.3s ease;
  }

  /* Animaciones para estados de carga de filtros */
  .filter-loading-state {
    animation: fadeIn 0.3s ease-out;
  }
  
  .spinner-circle-small {
    animation: spin 1s linear infinite;
  }
  
  /* Efectos de hover para botones de actualización */
  .refresh-btn-secondary:hover:not(:disabled) {
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  }
  
  /* Mejoras visuales para estados de carga */
  .mini-spinner {
    opacity: 0.8;
  }
  
  /* Efecto de pulsación suave para elementos interactivos */
  .refresh-btn-secondary:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }
</style>