// Task model
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  categoryId?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  completedAt?: number;
  dueDate?: number;
}

// Category model
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: number;
  taskCount?: number;
}

// Stats model
export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  byCategory: CategoryStat[];
  byPriority: PriorityStat[];
  recentActivity: number; // tasks completed in last 7 days
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  total: number;
  completed: number;
}

export interface PriorityStat {
  priority: 'low' | 'medium' | 'high';
  count: number;
}
