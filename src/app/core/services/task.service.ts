import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { Task, Category, TaskStats, CategoryStat } from '../models';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private storage: StorageService) {}

  // ── Observables ────────────────────────────────────────────────────────

  getFilteredTasks(categoryId: string | null): Observable<Task[]> {
    return this.storage.tasks$.pipe(
      map(tasks =>
        categoryId ? tasks.filter(t => t.categoryId === categoryId) : tasks
      ),
      map(tasks => tasks.sort((a, b) => b.createdAt - a.createdAt))
    );
  }

  getTasksWithCategory(): Observable<{ task: Task; category?: Category }[]> {
    return combineLatest([this.storage.tasks$, this.storage.categories$]).pipe(
      map(([tasks, categories]) =>
        tasks.map(task => ({
          task,
          category: categories.find(c => c.id === task.categoryId),
        }))
      )
    );
  }

  getStats(): Observable<TaskStats> {
    return combineLatest([this.storage.tasks$, this.storage.categories$]).pipe(
      map(([tasks, categories]: [Task[], Category[]]) => {
        const total = tasks.length;
        const completed = tasks.filter((t: Task) => t.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentActivity = tasks.filter(
          (t: Task) => t.completed && t.completedAt && t.completedAt > sevenDaysAgo
        ).length;

        const byCategory: CategoryStat[] = categories.map((cat: Category) => {
          const catTasks = tasks.filter((t: Task) => t.categoryId === cat.id);
          return {
            categoryId: cat.id,
            categoryName: cat.name,
            categoryColor: cat.color,
            total: catTasks.length,
            completed: catTasks.filter((t: Task) => t.completed).length,
          };
        });

        const byPriority = (['high', 'medium', 'low'] as const).map(priority => ({
          priority,
          count: tasks.filter((t: Task) => t.priority === priority).length,
        }));

        return { total, completed, pending, completionRate, byCategory, byPriority, recentActivity };
      })
    );
  }

  // ── CRUD ───────────────────────────────────────────────────────────────

  async createTask(data: Partial<Task>): Promise<void> {
    const task: Task = {
      id: generateId(),
      title: data.title || '',
      description: data.description,
      completed: false,
      categoryId: data.categoryId,
      priority: data.priority || 'medium',
      createdAt: Date.now(),
      dueDate: data.dueDate,
    };
    await this.storage.addTask(task);
  }

  async updateTask(task: Task): Promise<void> {
    await this.storage.updateTask(task);
  }

  async deleteTask(id: string): Promise<void> {
    await this.storage.deleteTask(id);
  }

  async toggleTask(id: string): Promise<void> {
    await this.storage.toggleTask(id);
  }

  // ── Categories CRUD ────────────────────────────────────────────────────

  async createCategory(data: Partial<Category>): Promise<void> {
    const category: Category = {
      id: generateId(),
      name: data.name || '',
      color: data.color || '#6c63ff',
      icon: data.icon || 'folder-outline',
      createdAt: Date.now(),
    };
    await this.storage.addCategory(category);
  }

  async updateCategory(category: Category): Promise<void> {
    await this.storage.updateCategory(category);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.storage.deleteCategory(id);
  }

  get categories$() {
    return this.storage.categories$;
  }

  get tasks$() {
    return this.storage.tasks$;
  }
}
