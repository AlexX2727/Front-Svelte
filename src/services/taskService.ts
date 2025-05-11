import axios from 'axios';

// Configuración base de axios
const API_URL = 'http://localhost:3000'; // Ajusta esta URL según donde esté ejecutándose tu API NestJS
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interfaz para el modelo de Tarea
export interface Task {
  id?: number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Clase de servicio para operaciones CRUD de tareas
export class TaskService {
  // Obtener todas las tareas
  async getTasks(): Promise<Task[]> {
    try {
      const response = await apiClient.get('/tasks');
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  // Obtener una tarea por ID
  async getTaskById(id: number): Promise<Task> {
    try {
      const response = await apiClient.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching task with id ${id}:`, error);
      throw error;
    }
  }

  // Crear una nueva tarea
  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    try {
      const response = await apiClient.post('/tasks', task);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Actualizar una tarea existente
  async updateTask(id: number, task: Partial<Task>): Promise<Task> {
    try {
      const response = await apiClient.patch(`/tasks/${id}`, task);
      return response.data;
    } catch (error) {
      console.error(`Error updating task with id ${id}:`, error);
      throw error;
    }
  }

  // Eliminar una tarea
  async deleteTask(id: number): Promise<void> {
    try {
      await apiClient.delete(`/tasks/${id}`);
    } catch (error) {
      console.error(`Error deleting task with id ${id}:`, error);
      throw error;
    }
  }
}

// Instancia del servicio para usar en los componentes
export const taskService = new TaskService();