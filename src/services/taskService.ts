// lib/services/taskService.ts
import api from '../lib/api';
import type { Task, CreateTaskRequest, UpdateTaskRequest, User, TaskFilters } from '../lib/types/task';

/**
 * Servicio para gestionar tareas
 */
export class TaskService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Obtener todas las tareas
   */
  static async getAllTasks(): Promise<Task[]> {
    try {
      const response = await api.get('/tasks', {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener todas las tareas:', error);
      throw error;
    }
  }

  /**
   * Obtener tareas con filtros
   */
  static async getTasksWithFilters(filters: TaskFilters): Promise<Task[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.projectId) params.append('projectId', filters.projectId.toString());
      if (filters.assigneeId) params.append('assigneeId', filters.assigneeId.toString());
      if (filters.myTasks) params.append('myTasks', 'true');
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);

      const response = await api.get(`/tasks/filter?${params.toString()}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener tareas filtradas:', error);
      throw error;
    }
  }

  /**
   * Obtener una tarea por ID
   */
  static async getTaskById(id: number): Promise<Task> {
    try {
      const response = await api.get(`/tasks/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Error al obtener tarea ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crear una nueva tarea
   */
  static async createTask(taskData: CreateTaskRequest): Promise<Task> {
    try {
      const response = await api.post('/tasks', taskData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error al crear tarea:', error);
      throw error;
    }
  }

  /**
   * Actualizar una tarea
   */
  static async updateTask(id: number, taskData: UpdateTaskRequest): Promise<Task> {
    try {
      const response = await api.patch(`/tasks/${id}`, taskData, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar tarea ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar una tarea
   */
  static async deleteTask(id: number): Promise<void> {
    try {
      await api.delete(`/tasks/${id}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error(`Error al eliminar tarea ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener tareas por proyecto
   */
  static async getTasksByProject(projectId: number): Promise<Task[]> {
    try {
      const response = await api.get(`/tasks/project/${projectId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Error al obtener tareas del proyecto ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener tareas asignadas a un usuario
   */
  static async getTasksByAssignee(userId: number): Promise<Task[]> {
    try {
      const response = await api.get(`/tasks/assignee/${userId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Error al obtener tareas del usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener miembros de un proyecto para asignación
   */
  static async getProjectMembers(projectId: number): Promise<User[]> {
    try {
      const response = await api.get(`/tasks/project/${projectId}/members`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Error al obtener miembros del proyecto ${projectId}:`, error);
      throw error;
    }
  }
}