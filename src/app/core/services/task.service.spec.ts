import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskService } from './task.service';
import { StorageService } from './storage.service';
import { BehaviorSubject } from 'rxjs';
import { Task, Category } from '../models';

// ── Mock StorageService ──────────────────────────────────────────────────
const mockTasksSubject = new BehaviorSubject<Task[]>([]);
const mockCategoriesSubject = new BehaviorSubject<Category[]>([]);

const mockStorage = {
  tasks$: mockTasksSubject.asObservable(),
  categories$: mockCategoriesSubject.asObservable(),
  addTask: jasmine.createSpy('addTask').and.callFake(async (t: Task) => {
    mockTasksSubject.next([...mockTasksSubject.value, t]);
  }),
  updateTask: jasmine.createSpy('updateTask').and.callFake(async (t: Task) => {
    mockTasksSubject.next(mockTasksSubject.value.map(x => (x.id === t.id ? t : x)));
  }),
  deleteTask: jasmine.createSpy('deleteTask').and.callFake(async (id: string) => {
    mockTasksSubject.next(mockTasksSubject.value.filter(x => x.id !== id));
  }),
  toggleTask: jasmine.createSpy('toggleTask').and.callFake(async (id: string) => {
    mockTasksSubject.next(
      mockTasksSubject.value.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  }),
  addCategory: jasmine.createSpy('addCategory').and.callFake(async (c: Category) => {
    mockCategoriesSubject.next([...mockCategoriesSubject.value, c]);
  }),
  updateCategory: jasmine.createSpy('updateCategory').and.returnValue(Promise.resolve()),
  deleteCategory: jasmine.createSpy('deleteCategory').and.returnValue(Promise.resolve()),
  saveTasks: jasmine.createSpy('saveTasks').and.returnValue(Promise.resolve()),
  saveCategories: jasmine.createSpy('saveCategories').and.returnValue(Promise.resolve()),
};

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    // Reset subjects
    mockTasksSubject.next([]);
    mockCategoriesSubject.next([]);
    // Reset spies
    Object.values(mockStorage).forEach(val => {
      if (typeof val === 'object' && val && 'calls' in val) {
        (val as unknown as jasmine.Spy).calls.reset();
      }
    });

    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: StorageService, useValue: mockStorage },
      ],
    });
    service = TestBed.inject(TaskService);
  });

  // ── createTask ────────────────────────────────────────────────────────

  it('should create a task with default priority medium', fakeAsync(async () => {
    await service.createTask({ title: 'Buy groceries' });
    tick();

    const tasks = mockTasksSubject.value;
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Buy groceries');
    expect(tasks[0].priority).toBe('medium');
    expect(tasks[0].completed).toBeFalse();
    expect(tasks[0].id).toBeTruthy();
  }));

  it('should create a task with specified priority and category', fakeAsync(async () => {
    await service.createTask({ title: 'Exercise', priority: 'high', categoryId: 'cat-1' });
    tick();

    const task = mockTasksSubject.value[0];
    expect(task.priority).toBe('high');
    expect(task.categoryId).toBe('cat-1');
  }));

  it('should generate unique IDs for each task', fakeAsync(async () => {
    await service.createTask({ title: 'Task A' });
    await service.createTask({ title: 'Task B' });
    tick();

    const ids = mockTasksSubject.value.map(t => t.id);
    expect(new Set(ids).size).toBe(2);
  }));

  // ── toggleTask ────────────────────────────────────────────────────────

  it('should toggle task completion', fakeAsync(async () => {
    await service.createTask({ title: 'Test toggle' });
    tick();

    const id = mockTasksSubject.value[0].id;
    await service.toggleTask(id);
    tick();

    expect(mockTasksSubject.value[0].completed).toBeTrue();

    await service.toggleTask(id);
    tick();

    expect(mockTasksSubject.value[0].completed).toBeFalse();
  }));

  // ── deleteTask ────────────────────────────────────────────────────────

  it('should delete a task by id', fakeAsync(async () => {
    await service.createTask({ title: 'To delete' });
    await service.createTask({ title: 'Keep me' });
    tick();

    const idToDelete = mockTasksSubject.value[0].id;
    await service.deleteTask(idToDelete);
    tick();

    expect(mockTasksSubject.value.length).toBe(1);
    expect(mockTasksSubject.value[0].title).toBe('Keep me');
  }));

  // ── getFilteredTasks ──────────────────────────────────────────────────

  it('should filter tasks by categoryId', fakeAsync(async () => {
    await service.createTask({ title: 'Work task', categoryId: 'work' });
    await service.createTask({ title: 'Personal task', categoryId: 'personal' });
    await service.createTask({ title: 'No category task' });
    tick();

    let filtered: Task[] = [];
    service.getFilteredTasks('work').subscribe(t => (filtered = t));
    tick();

    expect(filtered.length).toBe(1);
    expect(filtered[0].categoryId).toBe('work');
  }));

  it('should return all tasks when categoryId is null', fakeAsync(async () => {
    await service.createTask({ title: 'A' });
    await service.createTask({ title: 'B' });
    tick();

    let all: Task[] = [];
    service.getFilteredTasks(null).subscribe(t => (all = t));
    tick();

    expect(all.length).toBe(2);
  }));

  // ── getStats ──────────────────────────────────────────────────────────

  it('should compute completion rate correctly', fakeAsync(async () => {
    await service.createTask({ title: 'A' });
    await service.createTask({ title: 'B' });
    tick();

    // Toggle first task
    const id = mockTasksSubject.value[0].id;
    await service.toggleTask(id);
    tick();

    let stats: any;
    service.getStats().subscribe(s => (stats = s));
    tick();

    expect(stats.total).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.completionRate).toBe(50);
  }));

  it('should return 0% completion rate when no tasks', fakeAsync(() => {
    let stats: any;
    service.getStats().subscribe(s => (stats = s));
    tick();

    expect(stats.completionRate).toBe(0);
    expect(stats.total).toBe(0);
  }));

  // ── createCategory ────────────────────────────────────────────────────

  it('should create a category with correct fields', fakeAsync(async () => {
    await service.createCategory({ name: 'Work', color: '#6c63ff', icon: 'briefcase-outline' });
    tick();

    const cats = mockCategoriesSubject.value;
    expect(cats.length).toBe(1);
    expect(cats[0].name).toBe('Work');
    expect(cats[0].color).toBe('#6c63ff');
    expect(cats[0].icon).toBe('briefcase-outline');
  }));

  it('should call deleteCategory on storage', fakeAsync(async () => {
    await service.deleteCategory('cat-123');
    tick();

    expect(mockStorage.deleteCategory).toHaveBeenCalledWith('cat-123');
  }));
});
