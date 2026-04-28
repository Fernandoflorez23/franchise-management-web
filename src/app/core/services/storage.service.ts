import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Task, Category } from '../models';

const TASKS_KEY = 'taskflow_tasks';
const CATEGORIES_KEY = 'taskflow_categories';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private _storage: Storage | null = null;
  private initialized = false;

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private categoriesSubject = new BehaviorSubject<Category[]>([]);

  tasks$ = this.tasksSubject.asObservable();
  categories$ = this.categoriesSubject.asObservable();

  constructor(private storage: Storage) {
    this.init();
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this._storage = await this.storage.create();
    this.initialized = true;
    await this.loadAll();
  }

  private async loadAll(): Promise<void> {
    const tasks = (await this._storage?.get(TASKS_KEY)) || [];
    const categories = (await this._storage?.get(CATEGORIES_KEY)) || [];
    this.tasksSubject.next(tasks);
    this.categoriesSubject.next(categories);
  }

  // ── Tasks ──────────────────────────────────────────────────────────────

  async saveTasks(tasks: Task[]): Promise<void> {
    await this._storage?.set(TASKS_KEY, tasks);
    this.tasksSubject.next([...tasks]);
  }

  async addTask(task: Task): Promise<void> {
    const tasks = [...this.tasksSubject.value, task];
    await this.saveTasks(tasks);
  }

  async updateTask(updated: Task): Promise<void> {
    const tasks = this.tasksSubject.value.map(t =>
      t.id === updated.id ? updated : t
    );
    await this.saveTasks(tasks);
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = this.tasksSubject.value.filter(t => t.id !== id);
    await this.saveTasks(tasks);
  }

  async toggleTask(id: string): Promise<void> {
    const tasks = this.tasksSubject.value.map(t =>
      t.id === id
        ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined }
        : t
    );
    await this.saveTasks(tasks);
  }

  // ── Categories ─────────────────────────────────────────────────────────

  async saveCategories(categories: Category[]): Promise<void> {
    await this._storage?.set(CATEGORIES_KEY, categories);
    this.categoriesSubject.next([...categories]);
  }

  async addCategory(category: Category): Promise<void> {
    const categories = [...this.categoriesSubject.value, category];
    await this.saveCategories(categories);
  }

  async updateCategory(updated: Category): Promise<void> {
    const categories = this.categoriesSubject.value.map(c =>
      c.id === updated.id ? updated : c
    );
    await this.saveCategories(categories);
  }

  async deleteCategory(id: string): Promise<void> {
    // Remove category and unassign from tasks
    const categories = this.categoriesSubject.value.filter(c => c.id !== id);
    const tasks = this.tasksSubject.value.map(t =>
      t.categoryId === id ? { ...t, categoryId: undefined } : t
    );
    await this.saveCategories(categories);
    await this.saveTasks(tasks);
  }

  // ── Utility ────────────────────────────────────────────────────────────

  getTasksByCategory(categoryId: string | null): Task[] {
    if (!categoryId) return this.tasksSubject.value;
    return this.tasksSubject.value.filter(t => t.categoryId === categoryId);
  }

  async clearAll(): Promise<void> {
    await this._storage?.clear();
    this.tasksSubject.next([]);
    this.categoriesSubject.next([]);
  }
}
