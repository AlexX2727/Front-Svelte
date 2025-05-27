<script lang="ts">
  import { onMount } from 'svelte';
  import api from '../lib/api';
  import AddMemberModal from './AddMemberModal.svelte';

  // Props
  export let projectId: number;
  export let onClose: () => void;
  export let onSuccess: () => void;
  //lista de proyectos
  let projects = [];
  let selectedProjectId = projectId;
  // Interfaces
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

  interface Project {
    id: number;
    name: string;
    description: string;
    status: string;
  }

  // Estados
  let members: ProjectMember[] = [];
  let project: Project | null = null;
  let loading = true;
  let error: string | null = null;
  let success: string | null = null;
  let editingMemberId: number | null = null;
  let showDeleteConfirm = false;
  let memberToDelete: number | null = null;
  let submitting = false;
  let showAddMemberModal = false;

  // Roles disponibles
  const roles = [
    { label: "Miembro", value: "Member" },
    { label: "Líder", value: "Leader" },
    { label: "Colaborador", value: "Collaborator" },
    { label: "Observador", value: "Observer" },
    { label: "Gerente de Proyecto", value: "ProjectManager" },
  ];

  // Estado para edición
  let editForm = {
    role: ""
  };

  // Cargar datos iniciales
  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      loading = true;
      error = null;
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Cargar lista de proyectos
      const projectsResponse = await api.get(`/projects/owner/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      projects = projectsResponse.data;
      
      // Si hay un projectId inicial, cargar ese proyecto
      if (selectedProjectId) {
        await loadProjectMembers(selectedProjectId);
      } else if (projects.length > 0) {
        // Si no hay projectId inicial pero hay proyectos, cargar el primero
        selectedProjectId = projects[0].id;
        await loadProjectMembers(selectedProjectId);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      error = 'Error al cargar los datos. Por favor, intente de nuevo.';
    } finally {
      loading = false;
    }
  }
  async function loadProjectMembers(projectId) {
    try {
      loading = true;
      error = null;
      const token = localStorage.getItem('token');
      
      // Cargar información del proyecto
      const projectResponse = await api.get(`/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      project = projectResponse.data;
      
      // Cargar miembros del proyecto
      const membersResponse = await api.get(`/project-members/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      members = membersResponse.data;
    } catch (err) {
      console.error('Error al cargar datos del proyecto:', err);
      error = 'Error al cargar los datos del proyecto. Por favor, intente de nuevo.';
    } finally {
      loading = false;
    }
  }
  
  // Función para cambiar de proyecto
  async function handleProjectChange() {
    await loadProjectMembers(selectedProjectId);
  }
  

  // Iniciar edición de un miembro
  function startEdit(member: ProjectMember) {
    editingMemberId = member.id;
    editForm.role = member.role;
  }

  // Cancelar edición
  function cancelEdit() {
    editingMemberId = null;
  }

  // Guardar cambios de rol - CORREGIDO
  async function saveRoleChanges(memberId: number) {
    if (!editForm.role) {
      error = "Debe seleccionar un rol";
      return;
    }

    try {
      submitting = true;
      error = null;
      success = null;
      const token = localStorage.getItem('token');

      await api.patch(`/project-members/${memberId}`, {
        role: editForm.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      success = "Rol actualizado exitosamente";
      editingMemberId = null;
      
      // CAMBIO: Usar loadProjectMembers en lugar de loadData para evitar recargar todo
      await loadProjectMembers(selectedProjectId);
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        success = null;
      }, 3000);
      
    } catch (err: any) {
      console.error('Error al actualizar rol:', err);
      error = err.response?.data?.message || "Error al actualizar el rol";
    } finally {
      submitting = false;
    }
  }

  // Confirmar eliminación de miembro
  function confirmDeleteMember(memberId: number) {
    memberToDelete = memberId;
    showDeleteConfirm = true;
  }

  // Cancelar eliminación
  function cancelDelete() {
    showDeleteConfirm = false;
    memberToDelete = null;
  }

  // Eliminar miembro - CORREGIDO
  async function deleteMember() {
    if (!memberToDelete) return;

    try {
      submitting = true;
      error = null;
      success = null;
      const token = localStorage.getItem('token');

      await api.delete(`/project-members/${memberToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      success = "Miembro eliminado exitosamente";
      showDeleteConfirm = false;
      memberToDelete = null;
      
      // CAMBIO: Usar loadProjectMembers en lugar de loadData
      await loadProjectMembers(selectedProjectId);
      onSuccess(); // Notificar al componente padre
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        success = null;
      }, 3000);
      
    } catch (err: any) {
      console.error('Error al eliminar miembro:', err);
      error = err.response?.data?.message || "Error al eliminar el miembro";
      showDeleteConfirm = false;
    } finally {
      submitting = false;
    }
  }

  // Añadir nuevo miembro - CORREGIDO
  function handleAddMember() {
    showAddMemberModal = true;
  }

  // Obtener nombre para mostrar
  function getMemberDisplayName(member: ProjectMember): string {
    return member.user.fullName || member.user.username || member.user.email;
  }

  // Obtener etiqueta del rol
  function getRoleLabel(roleValue: string): string {
    const role = roles.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }

  // Manejar tecla Escape
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (showAddMemberModal) {
        showAddMemberModal = false;
      } else if (showDeleteConfirm) {
        cancelDelete();
      } else if (editingMemberId) {
        cancelEdit();
      } else {
        onClose();
      }
    }
  }

  // Funciones para manejar el AddMemberModal
  function handleCloseAddMember() {
    showAddMemberModal = false;
  }

  function handleMemberAdded() {
    showAddMemberModal = false;
    // Recargar los miembros del proyecto
    loadProjectMembers(selectedProjectId);
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="modal-overlay" 
  on:click={onClose}
  role="dialog"
  aria-labelledby="modal-title"
>
  <div 
    class="modal-content" 
    on:click|stopPropagation
    role="document"
  >
    <button class="close-button" on:click={onClose}>×</button>
    
    <h2 id="modal-title">
      {#if project}
        Miembros del Proyecto: {project.name}
      {:else}
        Miembros del Proyecto
      {/if}
    </h2>

    <!-- Selector de proyectos -->
    <div class="project-selector">
      <label for="project-select">Seleccionar Proyecto:</label>
      <select 
        id="project-select" 
        bind:value={selectedProjectId} 
        on:change={handleProjectChange}
        disabled={loading}
      >
        {#each projects as project}
          <option value={project.id}>{project.name}</option>
        {/each}
      </select>
    </div>

    {#if loading}
      <div class="loading-container">
        <div class="loader"></div>
        <p>Cargando miembros del proyecto...</p>
      </div>
    {:else if error}
      <div class="error-message" role="alert">{error}</div>
    {:else if success}
      <div class="success-message" role="status">
        <span>✓</span> {success}
      </div>
    {:else}
      <div class="members-container">
        {#if members.length === 0}
          <div class="no-members">
            <p>Este proyecto no tiene miembros asignados.</p>
            <button class="btn btn-primary" on:click={handleAddMember}>
              Añadir Miembro
            </button>
          </div>
        {:else}
          <div class="members-header">
            <h3>Miembros ({members.length})</h3>
            <button class="btn btn-primary" on:click={handleAddMember}>
              + Añadir Miembro
            </button>
          </div>
          
          <div class="members-list">
            {#each members as member (member.id)}
              <div class="member-card">
                <div class="member-info">
                  <div class="member-avatar">
                    {getMemberDisplayName(member).charAt(0).toUpperCase()}
                  </div>
                  <div class="member-details">
                    <h4 class="member-name">{getMemberDisplayName(member)}</h4>
                    <p class="member-email">{member.user.email}</p>
                    
                    {#if editingMemberId === member.id}
                      <div class="edit-role-form">
                        <select 
                          bind:value={editForm.role}
                          class="role-select"
                          disabled={submitting}
                        >
                          {#each roles as role}
                            <option value={role.value}>
                              {role.label}
                            </option>
                          {/each}
                        </select>
                        
                        <div class="edit-actions">
                          <button 
                            class="btn btn-sm btn-success" 
                            on:click={() => saveRoleChanges(member.id)}
                            disabled={submitting}
                          >
                            {submitting ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button 
                            class="btn btn-sm btn-secondary" 
                            on:click={cancelEdit}
                            disabled={submitting}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    {:else}
                      <span class="member-role">{getRoleLabel(member.role)}</span>
                    {/if}
                  </div>
                </div>
                
                {#if editingMemberId !== member.id}
                  <div class="member-actions">
                    <button 
                      class="action-button edit"
                      on:click={() => startEdit(member)}
                      title="Editar rol"
                    >
                      ✏️
                    </button>
                    <button 
                      class="action-button delete"
                      on:click={() => confirmDeleteMember(member.id)}
                      title="Eliminar miembro"
                    >
                      🗑️
                    </button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

{#if showDeleteConfirm}
  <div class="modal-overlay confirm-overlay" on:click={cancelDelete}>
    <div class="delete-confirm-modal" on:click|stopPropagation>
      <h3>¿Estás seguro?</h3>
      <p>Esta acción eliminará al miembro del proyecto. Esta acción no se puede deshacer.</p>
      <div class="modal-actions">
        <button class="btn-cancel" on:click={cancelDelete} disabled={submitting}>
          Cancelar
        </button>
        <button class="btn-delete" on:click={deleteMember} disabled={submitting}>
          {submitting ? 'Eliminando...' : 'Eliminar Miembro'}
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showAddMemberModal && selectedProjectId}
  <AddMemberModal
    projectId={selectedProjectId}
    onClose={handleCloseAddMember}
    onSuccess={handleMemberAdded}
  />
{/if}

<style>
  .project-selector {
    margin: 1rem;
    padding: 0.5rem;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: fadeIn 0.3s ease-out;
  }
  
  .project-selector label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #e0e0e0;
  }
  
  .project-selector select {
    width: 100%;
    padding: 0.5rem;
    border-radius: 4px;
    background-color: #1e293b;
    color: white;
    border: 1px solid #3b82f6;
    transition: all 0.3s ease;
  }

  .project-selector select:hover {
    border-color: #60a5fa;
  }

  .project-selector select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
  }

  .confirm-overlay {
    z-index: 1001;
  }

  .modal-content {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 2rem;
    border-radius: 12px;
    width: 90%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    border: 1px solid #3b82f6;
    box-shadow: 0 0 25px rgba(59, 130, 246, 0.2);
    animation: slideInUp 0.4s ease-out;
  }

  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #60a5fa;
    cursor: pointer;
    transition: color 0.3s ease, transform 0.2s ease;
  }

  .close-button:hover {
    color: #93c5fd;
    transform: scale(1.1);
  }

  h2 {
    margin: 0 0 1.5rem;
    color: #fff;
    font-size: 1.5rem;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 0.5rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 0;
  }

  .loader {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(59, 130, 246, 0.1);
    border-radius: 50%;
    border-top-color: #3b82f6;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

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

  .error-message {
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    color: #ef4444;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    animation: fadeIn 0.3s ease-out;
  }

  .success-message {
    background-color: rgba(34, 197, 94, 0.1);
    border: 1px solid #22c55e;
    color: #22c55e;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: fadeIn 0.3s ease-out;
  }

  .members-container {
    margin-top: 1rem;
    animation: fadeIn 0.4s ease-out;
  }

  .no-members {
    text-align: center;
    padding: 2rem;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    margin-bottom: 1rem;
    border: 1px dashed #3b82f6;
  }

  .members-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .members-header h3 {
    margin: 0;
    color: #fff;
    font-size: 1.2rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    border: none;
    transition: all 0.3s ease;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(37, 99, 235, 0.3);
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }

  .btn-success {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
    box-shadow: 0 4px 6px rgba(22, 163, 74, 0.2);
  }

  .btn-success:hover {
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(22, 163, 74, 0.3);
  }

  .btn-secondary {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    color: white;
    box-shadow: 0 4px 6px rgba(71, 85, 105, 0.2);
  }

  .btn-secondary:hover {
    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(71, 85, 105, 0.3);
  }

  .members-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .member-card {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #334155;
    transition: all 0.3s ease;
    animation: fadeIn 0.4s ease-out;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .member-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 8px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  .member-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .member-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 1.2rem;
    box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
  }

  .member-details {
    display: flex;
    flex-direction: column;
  }

  .member-name {
    margin: 0;
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
  }

  .member-email {
    margin: 0.25rem 0;
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .member-role {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background-color: rgba(59, 130, 246, 0.1);
    border: 1px solid #3b82f6;
    border-radius: 4px;
    color: #60a5fa;
    font-size: 0.8rem;
    margin-top: 0.25rem;
  }

  .member-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: none;
    transition: all 0.3s ease;
    background-color: transparent;
  }

  .action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .action-button.edit:hover {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .action-button.delete:hover {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .edit-role-form {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    animation: fadeIn 0.3s ease-out;
  }

  .role-select {
    padding: 0.5rem;
    border-radius: 4px;
    background-color: #1e293b;
    color: white;
    border: 1px solid #3b82f6;
    transition: all 0.3s ease;
  }

  .role-select:focus {
    outline: none;
    border-color: #60a5fa;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
  }

  /* Delete confirmation modal */
  .delete-confirm-modal {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 2rem;
    border-radius: 12px;
    max-width: 400px;
    width: 90%;
    text-align: center;
    border: 1px solid rgba(239, 68, 68, 0.3);
    box-shadow: 0 0 25px rgba(239, 68, 68, 0.2);
    animation: slideInUp 0.4s ease-out;
  }

  .delete-confirm-modal h3 {
    color: #ef4444;
    margin: 0 0 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .delete-confirm-modal p {
    color: #94a3b8;
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
    border: 1px solid #64748b;
    color: #94a3b8;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-delete {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border: none;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);
  }

  .btn-cancel:hover:not(:disabled) {
    background: rgba(100, 116, 139, 0.1);
    border-color: #94a3b8;
    color: #e2e8f0;
  }

  .btn-delete:hover:not(:disabled) {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(220, 38, 38, 0.3);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Responsive styles */
  @media (max-width: 768px) {
    .modal-content {
      padding: 1.5rem;
      width: 95%;
    }

    .member-info {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .member-card {
      flex-direction: column;
      align-items: flex-start;
    }

    .member-actions {
      margin-top: 1rem;
      align-self: flex-end;
    }
  }
</style>