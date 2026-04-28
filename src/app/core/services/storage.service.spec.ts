import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { Storage } from '@ionic/storage-angular';
import { Task, Category } from '../models';

// In-memory Storage mock
const inMemory: Record<string, any> = {};

const mockStorage = {
  create: jasmine.createSpy('create').and.returnValue(
    Promise.resolve({
      get: (key: string) => Promise.resolve(inMemory[key] ?? null),
      set: (key: string, val: any) => { inMemory[key] = val; return Promise.resolve(val); },
      clear: () => { Object.keys(inMemory).forEach(k => delete inMemory[k]); return Promise.resolve(); },
    })
  ),
};

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: `t-${Date.now()}-${Math.random()}`,
  title: 'Test task',
  completed: false,
  priority: 'medium',
  createdAt: Date.now(),
  ...overrides,
});

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: `c-${Date.now()}-${Math.random()}`,
  name: 'Test cat',
  color: '#6c63ff',
  icon: 'folder-outline',
  createdAt: Date.now(),
  ...overrides,
});

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    // Clear in-memory store
    Object.keys(inMemory).forEach(k => delete inMemory[k]);

    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: Storage, useValue: mockStorage },
      ],
    });
    service = TestBed.inject(StorageService);
    await service.init();
  });

  // ── Tasks ─────────────────────────────────────────────────────────────

  it('should start with empty tasks', (done) => {
    service.tasks$.subscribe(tasks => {
      expect(tasks.length).toBe(0);
      done();
    });
  });

  it('should add a task and emit it', fakeAsync(async () => {
    const task = makeTask({ title: 'My task' });
    await service.addTask(task);
    tick();

    let emitted: Task[] = [];
    service.tasks$.subscribe(t => (emitted = t));
    tick();

    expect(emitted.length).toBe(1);
    expect(emitted[0].title).toBe('My task');
  }));

  it('should update a task', fakeAsync(async () => {
    const task = makeTask({ title: 'Original' });
    await service.addTask(task);
    tick();

    await service.updateTask({ ...task, title: 'Updated' });
    tick();

    let emitted: Task[] = [];
    service.tasks$.subscribe(t => (emitted = t));
    tick();

    expect(emitted[0].title).toBe('Updated');
  }));

  it('should delete a task', fakeAsync(async () => {
    const t1 = makeTask({ title: 'Keep' });
    const t2 = makeTask({ title: 'Delete me' });
    await service.addTask(t1);
    await service.addTask(t2);
    tick();

    await service.deleteTask(t2.id);
    tick();

    let emitted: Task[] = [];
    service.tasks$.subscribe(t => (emitted = t));
    tick();

    expect(emitted.length).toBe(1);
    expect(emitted[0].id).toBe(t1.id);
  }));

  it('should toggle task completion status', fakeAsync(async () => {
    const task = makeTask({ completed: false });
    await service.addTask(task);
    tick();

    await service.toggleTask(task.id);
    tick();

    let emitted: Task[] = [];
    service.tasks$.subscribe(t => (emitted = t));
    tick();

    expect(emitted[0].completed).toBeTrue();
    expect(emitted[0].completedAt).toBeDefined();
  }));

  // ── Categories ────────────────────────────────────────────────────────

  it('should add a category', fakeAsync(async () => {
    const cat = makeCategory({ name: 'Work' });
    await service.addCategory(cat);
    tick();

    let emitted: Category[] = [];
    service.categories$.subscribe(c => (emitted = c));
    tick();

    expect(emitted.length).toBe(1);
    expect(emitted[0].name).toBe('Work');
  }));

  it('should delete category and unassign tasks', fakeAsync(async () => {
    const cat = makeCategory({ id: 'cat-1' });
    const task = makeTask({ categoryId: 'cat-1' });
    await service.addCategory(cat);
    await service.addTask(task);
    tick();

    await service.deleteCategory('cat-1');
    tick();

    let tasks: Task[] = [];
    service.tasks$.subscribe(t => (tasks = t));
    tick();

    expect(tasks[0].categoryId).toBeUndefined();
  }));

  it('should clear all data', fakeAsync(async () => {
    await service.addTask(makeTask());
    await service.addCategory(makeCategory());
    tick();

    await service.clearAll();
    tick();

    let tasks: Task[] = [], cats: Category[] = [];
    service.tasks$.subscribe(t => (tasks = t));
    service.categories$.subscribe(c => (cats = c));
    tick();

    expect(tasks.length).toBe(0);
    expect(cats.length).toBe(0);
  }));
});
