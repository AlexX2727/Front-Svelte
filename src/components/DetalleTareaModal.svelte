<script lang="ts">
    import { onMount } from 'svelte';
    import api from '../lib/api';
    
    // Props
    export let taskId: number;
    export let onClose: () => void;
    export let onSuccess: () => void;
    
    // Interfaces
    interface Task {
      id: number;
      project_id: number;
      assignee_id?: number;
      title: string;
      description?: string;
      status: string;
      priority: string;
      dueDate?: string;
      estimatedHours?: number;
      actualHours?: string;
      completedAt?: string;
      createdAt: string;
      updatedAt: string;
      assignee?: {
        id: number;
        username: string;
        email: string;
        fullName: string;
      };
      project?: {
        id: number;
        name: string;
        status: string;
      };
    }
  
    interface ProjectMember {
      id: number;
      project_id: number;
      user_id: number;
      role: string;
      user: {
        id: number;
        username: string;
        email: string;
        fullName: string;
      };
    }
    
    // Estados
    let task: Task | null = null;
    let projectMembers: ProjectMember[] = [];
    let isEditing = false;
    let loading = true;
    let submitting = false;
    let error: string | null = null;
    let success: string | null = null;
    let showDeleteConfirm = false;
    
    // Estado del formulario para edición
    let editForm = {
      title: '',
      description: '',
      status: '',
      priority: '',
      dueDate: '',
      estimatedHours: '',
      actualHours: '',
      completedAt: '',
      assignee_id: ''
    };
    
    // Cargar datos iniciales
    async function loadTaskData() {
      try {
        loading = true;
        error = null;
        
        const token = localStorage.getItem('token');
        if (!token) {
          onClose();
          return;
        }
        
        // Obtener datos de la tarea
        const response = await api.get(`/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        task = response.data;
        
        // Inicializar el formulario con los datos de la tarea
        editForm = {
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'Todo',
          priority: task.priority || 'Medium',
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
          estimatedHours: task.estimatedHours ? task.estimatedHours.toString() : '',
          actualHours: task.actualHours || '',
          completedAt: task.completedAt ? task.completedAt.split('T')[0] : '',
          assignee_id: task.assignee_id ? task.assignee_id.toString() : ''
        };
        
        // Cargar miembros del proyecto para la asignación
        if (task.project_id) {
          const membersResponse = await api.get(`/project-members/project/${task.project_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          projectMembers = membersResponse.data;
        }
        
      } catch (err) {
        console.error('Error al cargar datos de la tarea:', err);
        error = 'Error al cargar los datos de la tarea. Por favor, intente de nuevo.';
      } finally {
        loading = false;
      }
    }
    
    // Validar formulario
    function validateForm(): boolean {
      error = null;
      
      // Validar que el título esté presente
      if (!editForm.title.trim()) {
        error = 'El título de la tarea es obligatorio';
        return false;
      }
      
      // Validar que las horas estimadas y actuales sean válidas
      if (editForm.estimatedHours && isNaN(Number(editForm.estimatedHours))) {
        error = 'Las horas estimadas deben ser un número válido';
        return false;
      }
      
      if (editForm.actualHours && isNaN(Number(editForm.actualHours))) {
        error = 'Las horas reales deben ser un número válido';
        return false;
      }
      
      // Validar formato de fecha
      if (editForm.dueDate && isNaN(Date.parse(editForm.dueDate))) {
        error = 'La fecha límite no es válida';
        return false;
      }
      
      if (editForm.completedAt && isNaN(Date.parse(editForm.completedAt))) {
        error = 'La fecha de completado no es válida';
        return false;
      }
      
      return true;
    }
    
    // Manejar envío del formulario
    async function handleSubmit() {
      if (!validateForm()) return;
      if (!task) return;
      
      submitting = true;
      error = null;
      
      try {
        // Preparar datos con los tipos correctos
        const updateData = {
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          status: editForm.status,
          priority: editForm.priority,
          dueDate: editForm.dueDate || null,
          estimatedHours: editForm.estimatedHours ? parseFloat(editForm.estimatedHours) : null,
          actualHours: editForm.actualHours || null,
          completedAt: editForm.completedAt || null,
          assignee_id: editForm.assignee_id ? parseInt(editForm.assignee_id, 10) : null
        };
        
        // Obtener el token
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        const response = await api.patch(`/tasks/${taskId}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        success = 'Tarea actualizada correctamente';
        isEditing = false;
        
        // Notificar éxito y recargar datos
        setTimeout(() => {
          onSuccess();
          loadTaskData();
        }, 1500);
      } catch (err: any) {
        console.error('Error al actualizar tarea:', err);
        error = err.response?.data?.message || 'Error al actualizar la tarea';
      } finally {
        submitting = false;
      }
    }
    
    // Eliminar tarea
    async function handleDelete() {
      showDeleteConfirm = true;
    }
    
    async function confirmDelete() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          onClose();
          return;
        }
        
        await api.delete(`/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        success = 'Tarea eliminada correctamente';
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } catch (err: any) {
        console.error('Error al eliminar tarea:', err);
        error = err.response?.data?.message || 'Error al eliminar la tarea';
      } finally {
        showDeleteConfirm = false;
      }
    }
    
    // Formatear fechas para visualización
    function formatDate(dateStr?: string): string {
      if (!dateStr) return 'No definida';
      
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return 'Fecha inválida';
      }
    }
    
    // Obtener clase de estado
    function getEstadoClass(estado?: string): string {
      switch (estado) {
        case 'Todo': return 'estado-pendiente';
        case 'In Progress': return 'estado-progreso';
        case 'Review': return 'estado-revision';
        case 'Done': return 'estado-completado';
        case 'Blocked': return 'estado-bloqueado';
        default: return '';
      }
    }
    
    // Obtener texto según estado
    function getEstadoTexto(estado?: string): string {
      switch (estado) {
        case 'Todo': return 'Por Hacer';
        case 'In Progress': return 'En Progreso';
        case 'Review': return 'En Revisión';
        case 'Done': return 'Completado';
        case 'Blocked': return 'Bloqueado';
        default: return 'Desconocido';
      }
    }
    
    // Obtener clase de prioridad
    function getPrioridadClass(prioridad?: string): string {
      switch (prioridad) {
        case 'Low': return 'prioridad-baja';
        case 'Medium': return 'prioridad-media';
        case 'High': return 'prioridad-alta';
        case 'Critical': return 'prioridad-critica';
        default: return '';
      }
    }
    
    // Limpiar mensajes después de un tiempo
    function clearMessages() {
      if (success || error) {
        setTimeout(() => {
          success = null;
          error = null;
        }, 5000);
      }
    }
    
    // Cargar datos al montar el componente
    onMount(() => {
      loadTaskData();
    });
    
    // Observar cambios en success o error para limpiar mensajes
    $: if (success || error) clearMessages();
  </script>
  
  <div class="modal-overlay" on:click={onClose}>
    <div class="modal-content" on:click|stopPropagation>
      {#if loading}
        <div class="loading-container">
          <div class="loader"></div>
          <p>Cargando datos de la tarea...</p>
        </div>
      {:else if !task}
        <div class="mensaje-error">No se pudo cargar la tarea o no existe.</div>
        <button class="btn-volver" on:click={onClose}>Cerrar</button>
      {:else}
        <div class="modal-header">
          <h2>{isEditing ? 'Editar Tarea' : 'Detalle de Tarea'}</h2>
          <button class="btn-cerrar" on:click={onClose}>×</button>
        </div>
  
        <!-- Mensajes de estado -->
        {#if error}
          <div class="mensaje-error">{error}</div>
        {/if}
        {#if success}
          <div class="mensaje-success">{success}</div>
        {/if}
  
        <div class="modal-body">
          <!-- Vista de detalle o formulario de edición -->
          {#if isEditing}
            <form class="tarea-form">
              <div class="form-section">
                <h3>Información General</h3>
                
                <div class="form-group">
                  <label for="title">Título:</label>
                  <input 
                    type="text" 
                    id="title" 
                    name="title" 
                    bind:value={editForm.title} 
                    required
                  />
                </div>
                
                <div class="form-group">
                  <label for="description">Descripción:</label>
                  <textarea 
                    id="description" 
                    name="description" 
                    bind:value={editForm.description} 
                    rows={4}
                  ></textarea>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="status">Estado:</label>
                    <select 
                      id="status" 
                      name="status" 
                      bind:value={editForm.status}
                    >
                      <option value="Todo">Por Hacer</option>
                      <option value="In Progress">En Progreso</option>
                      <option value="Review">En Revisión</option>
                      <option value="Done">Completado</option>
                      <option value="Blocked">Bloqueado</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="priority">Prioridad:</label>
                    <select 
                      id="priority" 
                      name="priority" 
                      bind:value={editForm.priority}
                    >
                      <option value="Low">Baja</option>
                      <option value="Medium">Media</option>
                      <option value="High">Alta</option>
                      <option value="Critical">Crítica</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="form-section">
                <h3>Fechas y Tiempos</h3>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="dueDate">Fecha límite:</label>
                    <input 
                      type="date" 
                      id="dueDate" 
                      name="dueDate" 
                      bind:value={editForm.dueDate}
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="completedAt">Fecha de completado:</label>
                    <input 
                      type="date" 
                      id="completedAt" 
                      name="completedAt" 
                      bind:value={editForm.completedAt}
                    />
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="estimatedHours">Horas estimadas:</label>
                    <input 
                      type="number" 
                      id="estimatedHours" 
                      name="estimatedHours" 
                      bind:value={editForm.estimatedHours}
                      min="0"
                      step="0.5"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="actualHours">Horas reales:</label>
                    <input 
                      type="number" 
                      id="actualHours" 
                      name="actualHours" 
                      bind:value={editForm.actualHours}
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>
              </div>
              
              <div class="form-section">
                <h3>Asignación</h3>
                
                <div class="form-group">
                  <label for="assignee_id">Asignado a:</label>
                  <select 
                    id="assignee_id" 
                    name="assignee_id" 
                    bind:value={editForm.assignee_id}
                  >
                    <option value="">Sin asignar</option>
                    {#each projectMembers as member}
                      <option value={member.user.id}>
                        {member.user.fullName || member.user.username} ({member.role})
                      </option>
                    {/each}
                  </select>
                </div>
              </div>
            </form>
          {:else}
            <div class="tarea-detalle">
              <div class="detalle-section">
                <h3>Información General</h3>
                
                <div class="detalle-campo">
                  <span class="campo-label">Título:</span>
                  <span class="campo-valor titulo-tarea">{task.title}</span>
                </div>
                
                <div class="detalle-campo">
                  <span class="campo-label">Proyecto:</span>
                  <span class="campo-valor">{task.project?.name || 'No especificado'}</span>
                </div>
                
                <div class="detalle-campo">
                  <span class="campo-label">Descripción:</span>
                  <div class="campo-valor descripcion-tarea">
                    {task.description || 'Sin descripción'}
                  </div>
                </div>
                
                <div class="detalle-row">
                  <div class="detalle-campo">
                    <span class="campo-label">Estado:</span>
                    <span class={`estado-badge ${getEstadoClass(task.status)}`}>
                      {getEstadoTexto(task.status)}
                    </span>
                  </div>
                  
                  <div class="detalle-campo">
                    <span class="campo-label">Prioridad:</span>
                    <span class={`prioridad-badge ${getPrioridadClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="detalle-section">
                <h3>Fechas y Tiempos</h3>
                
                <div class="detalle-row">
                  <div class="detalle-campo">
                    <span class="campo-label">Fecha de creación:</span>
                    <span class="campo-valor">{formatDate(task.createdAt)}</span>
                  </div>
                  
                  <div class="detalle-campo">
                    <span class="campo-label">Última actualización:</span>
                    <span class="campo-valor">{formatDate(task.updatedAt)}</span>
                  </div>
                </div>
                
                <div class="detalle-row">
                  <div class="detalle-campo">
                    <span class="campo-label">Fecha límite:</span>
                    <span class="campo-valor">
                      {task.dueDate ? formatDate(task.dueDate) : 'No definida'}
                    </span>
                  </div>
                  
                  <div class="detalle-campo">
                    <span class="campo-label">Fecha de completado:</span>
                    <span class="campo-valor">
                      {task.completedAt ? formatDate(task.completedAt) : 'No completada'}
                    </span>
                  </div>
                </div>
                
                <div class="detalle-row">
                  <div class="detalle-campo">
                    <span class="campo-label">Horas estimadas:</span>
                    <span class="campo-valor">
                      {task.estimatedHours ? `${task.estimatedHours} horas` : 'No definidas'}
                    </span>
                  </div>
                  
                  <div class="detalle-campo">
                    <span class="campo-label">Horas reales:</span>
                    <span class="campo-valor">
                      {task.actualHours ? `${task.actualHours} horas` : 'No registradas'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="detalle-section">
                <h3>Asignación</h3>
                
                <div class="detalle-campo">
                  <span class="campo-label">Asignado a:</span>
                  {#if task.assignee}
                    <div class="detalle-usuario">
                      <span class="nombre-usuario">
                        {task.assignee.fullName || task.assignee.username}
                      </span>
                      <span class="email-usuario">({task.assignee.email})</span>
                    </div>
                  {:else}
                    <span class="sin-asignar">Sin asignar</span>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        </div>
  
        <div class="modal-footer">
          {#if isEditing}
            <button 
              class="btn-cancelar" 
              on:click={() => isEditing = false}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button 
              class="btn-guardar"
              on:click={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          {:else}
            <button class="btn-eliminar" on:click={handleDelete}>
              Eliminar
            </button>
            <button class="btn-editar" on:click={() => isEditing = true}>
              Editar
            </button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
  
  {#if showDeleteConfirm}
    <div class="modal-overlay confirm-overlay" on:click={() => showDeleteConfirm = false}>
      <div class="delete-confirm-modal" on:click|stopPropagation>
        <h3>¿Estás seguro?</h3>
        <p>Esta acción eliminará la tarea y no se puede deshacer.</p>
        <div class="modal-actions">
          <button class="btn-cancel" on:click={() => showDeleteConfirm = false}>
            Cancelar
          </button>
          <button class="btn-delete" on:click={confirmDelete}>
            Eliminar Tarea
          </button>
        </div>
      </div>
    </div>
  {/if}
  
  <style>
    /* Estilos del modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .modal-content {
      background: var(--card-bg, #1a1a1a);
      border-radius: 12px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .modal-header h2 {
      margin: 0;
      color: var(--text-primary, #ffffff);
      font-size: 1.5rem;
    }
    
    .btn-cerrar {
      background: transparent;
      border: none;
      color: var(--text-secondary, #b0b0b0);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    
    .btn-cerrar:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary, #ffffff);
    }
    
    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }
    
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Loading state */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: var(--text-secondary, #b0b0b0);
    }
    
    .loader {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border-top-color: var(--accent-color, #3498db);
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    
    /* Estilos de formulario */
    .tarea-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .form-section {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .form-section h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: var(--text-primary, #ffffff);
      font-size: 1.25rem;
      font-weight: 500;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-secondary, #b0b0b0);
      font-size: 0.9rem;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    input[type="text"],
    input[type="number"],
    input[type="date"],
    textarea,
    select {
      width: 100%;
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: var(--text-primary, #ffffff);
      font-size: 1rem;
      transition: all 0.3s ease;
    }
    
    input:focus,
    textarea:focus,
    select:focus {
      outline: none;
      border-color: var(--accent-color, #3498db);
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }
    
    /* Estilos de vista detalle */
    .tarea-detalle {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .detalle-section {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .detalle-section h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: var(--text-primary, #ffffff);
      font-size: 1.25rem;
      font-weight: 500;
    }
    
    .detalle-campo {
      margin-bottom: 1rem;
    }
    
    .detalle-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    .campo-label {
      display: block;
      margin-bottom: 0.25rem;
      color: var(--text-secondary, #b0b0b0);
      font-size: 0.9rem;
    }
    
    .campo-valor {
      color: var(--text-primary, #ffffff);
      font-size: 1rem;
    }
    
    .titulo-tarea {
      font-size: 1.2rem;
      font-weight: 500;
    }
    
    .descripcion-tarea {
      white-space: pre-line;
      line-height: 1.5;
    }
    
    /* Estilos de estado y prioridad */
    .estado-badge,
    .prioridad-badge {
      display: inline-block;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.85rem;
      color: white;
    }
    
    .estado-pendiente {
      background-color: #7f8c8d;
    }
    
    .estado-progreso {
      background-color: #3498db;
    }
    
    .estado-revision {
      background-color: #9b59b6;
    }
    
    .estado-completado {
      background-color: #2ecc71;
    }
    
    .estado-bloqueado {
      background-color: #e74c3c;
    }
    
    .prioridad-baja {
      background-color: #2ecc71;
    }
    
    .prioridad-media {
      background-color: #f39c12;
    }
    
    .prioridad-alta {
      background-color: #e67e22;
    }
    
    .prioridad-critica {
      background-color: #e74c3c;
    }
    
    /* Estilos del usuario asignado */
    .detalle-usuario {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .nombre-usuario {
      font-weight: 500;
    }
    
    .email-usuario {
      color: var(--text-secondary, #b0b0b0);
      font-size: 0.9rem;
    }
    
    .sin-asignar {
      color: var(--text-secondary, #b0b0b0);
      font-style: italic;
    }
    
    /* Botones */
    button {
      padding: 0.75rem 1.25rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.3s ease;
      border: none;
    }
    
    .btn-guardar {
      background-color: var(--accent-color, #3498db);
      color: white;
    }
    
    .btn-guardar:hover {
      background-color: #2980b9;
    }
    
    .btn-guardar:disabled {
      background-color: #7f8c8d;
      cursor: not-allowed;
      opacity: 0.7;
    }
    
    .btn-editar {
      background-color: var(--accent-color, #3498db);
      color: white;
    }
    
    .btn-editar:hover {
      background-color: #2980b9;
    }
    
    .btn-eliminar {
      background-color: #e74c3c;
      color: white;
    }
    
    .btn-eliminar:hover {
      background-color: #c0392b;
    }
    
    .btn-cancelar {
      background-color: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: var(--text-secondary, #b0b0b0);
    }
    
    .btn-cancelar:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--text-primary, #ffffff);
    }
    
    .btn-volver {
      background-color: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: var(--text-secondary, #b0b0b0);
    }
    
    .btn-volver:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--text-primary, #ffffff);
    }
    
    /* Mensajes de estado */
    .mensaje-error,
    .mensaje-success {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin: 0 1.5rem 1rem;
      font-size: 0.9rem;
    }
    
    .mensaje-error {
      background-color: rgba(231, 76, 60, 0.2);
      border: 1px solid rgba(231, 76, 60, 0.5);
      color: #e74c3c;
    }
    
    .mensaje-success {
      background-color: rgba(46, 204, 113, 0.2);
      border: 1px solid rgba(46, 204, 113, 0.5);
      color: #2ecc71;
    }
    
    /* Confirmación de eliminación */
    .confirm-overlay {
      z-index: 1100;
    }
    
    .delete-confirm-modal {
      background: #1a1a1a;
      padding: 2rem;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      border: 1px solid rgba(231, 76, 60, 0.2);
    }
    
    .delete-confirm-modal h3 {
      color: #e74c3c;
      margin: 0 0 1rem;
    }
    
    .delete-confirm-modal p {
      color: #b0b0b0;
      margin-bottom: 2rem;
    }
    
    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    
    .btn-cancel {
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: 1px solid #b0b0b0;
      color: #b0b0b0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn-delete {
      padding: 0.75rem 1.5rem;
      background: #e74c3c;
      border: none;
      color: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn-cancel:hover {
      background: rgba(176, 176, 176, 0.1);
    }
    
    .btn-delete:hover {
      background: #c0392b;
    }
    
    /* Responsive styles */
    @media (max-width: 768px) {
      .modal-content {
        width: 95%;
        max-height: 95vh;
      }
      
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .detalle-row {
        grid-template-columns: 1fr;
      }
      
      .modal-footer {
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .modal-footer button {
        width: 100%;
      }
    }
  </style>