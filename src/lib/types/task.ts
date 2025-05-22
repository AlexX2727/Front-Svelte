// lib/types/task.ts

/**
 * Enum para los estados de las tareas
 */
export enum TaskStatus {
    TODO = 'Todo',
    IN_PROGRESS = 'In Progress',
    REVIEW = 'Review',
    DONE = 'Done',
    BLOCKED = 'Blocked'
  }
  
  /**
   * Enum para las prioridades de las tareas
   */
  export enum TaskPriority {
    LOW = 'Low',
    MEDIUM = 'Medium',
    HIGH = 'High',
    CRITICAL = 'Critical'
  }
  
  /**
   * Interface para usuario básico
   */
  export interface User {
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    avatar?: string;
    role?: string;
  }
  
  /**
   * Interface para proyecto básico
   */
  export interface Project {
    id: number;
    name: string;
    status?: string;
  }
  
  /**
   * Interface para comentario
   */
  export interface Comment {
    id: number;
    task_id: number;
    user_id: number;
    content: string;
    createdAt: string;
    updatedAt: string;
    user: User;
  }
  
  /**
   * Interface para archivo adjunto
   */
  export interface Attachment {
    id: number;
    task_id: number;
    user_id: number;
    filename: string;
    originalName: string;
    path: string;
    mimeType: string;
    size: number;
    createdAt: string;
    updatedAt: string;
    user: User;
  }
  
  /**
   * Interface base para una tarea completa (respuesta del backend)
   */
  export interface Task {
    id: number;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: string;
    completedAt?: string;
    project_id: number;
    assignee_id?: number;
    createdAt: string;
    updatedAt: string;
    project?: Project;
    assignee?: User;
    comments?: Comment[];
    attachments?: Attachment[];
    _count?: {
      comments: number;
      attachments: number;
    };
  }
  
  /**
   * Interface para crear una nueva tarea
   * Coincide con CreateTaskDto del backend
   */
  export interface CreateTaskRequest {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: string;
    completedAt?: string;
    project_id: number;
    assignee_id?: number;
  }
  
  /**
   * Interface para actualizar una tarea
   * Coincide con UpdateTaskDto del backend
   */
  export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    estimatedHours?: number;
    actualHours?: string;
    completedAt?: string;
    assignee_id?: number;
  }
  
  /**
   * Interface para filtros de tareas
   */
  export interface TaskFilters {
    projectId?: number;
    assigneeId?: number;
    myTasks?: boolean;
    status?: TaskStatus;
    priority?: TaskPriority;
    searchTerm?: string;
  }