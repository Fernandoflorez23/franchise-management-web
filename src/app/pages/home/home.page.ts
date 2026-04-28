import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
} from "@angular/core";
import { AsyncPipe, NgFor, NgIf, NgClass, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonChip,
  IonCheckbox,
  IonFab,
  IonFabButton,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSearchbar,
  IonBadge,
  IonText,
  IonNote,
  IonSegment,
  IonSegmentButton,
  AlertController,
  ToastController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  add,
  trash,
  checkmark,
  closeCircle,
  pencil,
  filterOutline,
  alertCircleOutline,
  timeOutline,
  flagOutline,
  close,
  funnel,
  checkmarkCircle,
  checkmarkCircleOutline,
  ellipsisVertical,
  funnelOutline,
  sparkles,
} from "ionicons/icons";
import { Subject } from "rxjs";
import { takeUntil, map } from "rxjs/operators";
import { Observable } from "rxjs";

import { TaskService } from "../../core/services/task.service";
import {
  FirebaseService,
  FeatureFlags,
} from "../../core/services/firebase.service";
import { Task, Category } from "../../core/models";

type FilterMode = "all" | "active" | "completed";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    NgClass,
    DatePipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonButtons,
    IonModal,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonChip,
    IonCheckbox,
    IonFab,
    IonFabButton,
    IonList,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonSearchbar,
    IonBadge,
    IonText,
    IonNote,
    IonSegment,
    IonSegmentButton,
  ],
})
export class HomePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild("taskModal") modal!: IonModal;

  // ── State ──────────────────────────────────────────────────────────────
  tasks$!: Observable<Task[]>;
  categories$!: Observable<Category[]>;
  flags$!: Observable<FeatureFlags>;

  selectedCategoryId: string | null = null;
  searchQuery = "";
  filterMode: FilterMode = "all";

  // Modal state
  isTaskModalOpen = false;
  editingTask: Task | null = null;

  // Form fields
  taskTitle = "";
  taskDescription = "";
  taskCategoryId = "";
  taskPriority: "low" | "medium" | "high" = "medium";
  taskDueDate = "";

  // Priority options
  priorities = [
    {
      value: "high",
      label: "High",
      color: "#ff6b6b",
      icon: "alert-circle-outline",
    },
    {
      value: "medium",
      label: "Medium",
      color: "#ffd43b",
      icon: "flag-outline",
    },
    { value: "low", label: "Low", color: "#51cf66", icon: "time-outline" },
  ] as const;

  constructor(
    private taskService: TaskService,
    private firebaseService: FirebaseService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({
      add,
      trash,
      checkmark,
      closeCircle,
      pencil,
      filterOutline,
      alertCircleOutline,
      timeOutline,
      flagOutline,
      close,
      funnel,
      checkmarkCircle,
      checkmarkCircleOutline,
      ellipsisVertical,
      funnelOutline,
      sparkles,
    });
  }

  ngOnInit(): void {
    // --- LÍNEA SALVAVIDAS ---
    // Elimina cualquier escudo fantasma que Ionic haya dejado trabado
    document.body.classList.remove("backdrop-no-scroll");
    // ------------------------

    this.categories$ = this.taskService.categories$;
    this.flags$ = this.firebaseService.featureFlags$;
    this.updateTaskStream();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Filtering ──────────────────────────────────────────────────────────

  updateTaskStream(): void {
    this.tasks$ = this.taskService
      .getFilteredTasks(this.selectedCategoryId)
      .pipe(
        takeUntil(this.destroy$),
        map((tasks) => this.applyFilters(tasks)),
      );
  }

  applyFilters(tasks: Task[]): Task[] {
    let filtered = tasks;

    // Search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
    }

    // Status filter
    if (this.filterMode === "active") {
      filtered = filtered.filter((t) => !t.completed);
    } else if (this.filterMode === "completed") {
      filtered = filtered.filter((t) => t.completed);
    }

    // Sort: incomplete first, then by priority, then by date
    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pOrder = { high: 0, medium: 1, low: 2 };
      if (pOrder[a.priority] !== pOrder[b.priority])
        return pOrder[a.priority] - pOrder[b.priority];
      return b.createdAt - a.createdAt;
    });
  }

  onSearch(event: CustomEvent): void {
    this.searchQuery = event.detail.value || "";
    this.updateTaskStream();
  }

  onFilterChange(event: CustomEvent): void {
    this.filterMode = event.detail.value as FilterMode;
    this.updateTaskStream();
  }

  selectCategory(id: string | null): void {
    this.selectedCategoryId = id;
    this.updateTaskStream();
  }

  // ── TrackBy for performance ────────────────────────────────────────────

  trackByTaskId(_: number, task: Task): string {
    return task.id;
  }

  trackByCategoryId(_: number, cat: Category): string {
    return cat.id;
  }

  // ── Task actions ───────────────────────────────────────────────────────

  async toggleTask(task: Task): Promise<void> {
    await this.taskService.toggleTask(task.id);
    const toast = await this.toastCtrl.create({
      message: task.completed ? "Task marked as pending" : "✓ Task completed!",
      duration: 1500,
      position: "bottom",
      cssClass: "custom-toast",
      color: task.completed ? "medium" : "success",
    });
    await toast.present();
  }

  async deleteTask(task: Task, sliding?: any): Promise<void> {
    await sliding?.close();
    const alert = await this.alertCtrl.create({
      header: "Delete Task",
      message: `Are you sure you want to delete "${task.title}"?`,
      cssClass: "custom-alert",
      buttons: [
        { text: "Cancel", role: "cancel" },
        {
          text: "Delete",
          role: "destructive",
          cssClass: "danger",
          handler: async () => {
            await this.taskService.deleteTask(task.id);
          },
        },
      ],
    });
    await alert.present();
  }

  openEditTask(task: Task, sliding?: any): void {
    sliding?.close();
    this.editingTask = task;
    this.taskTitle = task.title;
    this.taskDescription = task.description || "";
    this.taskCategoryId = task.categoryId || "";
    this.taskPriority = task.priority;
    this.taskDueDate = task.dueDate ? new Date(task.dueDate).toISOString() : "";

    // Solución: Abre el modal de forma declarativa
    this.isTaskModalOpen = true;
  }

  openNewTask(): void {
    this.editingTask = null;
    this.taskTitle = "";
    this.taskDescription = "";
    this.taskCategoryId = "";
    this.taskPriority = "medium";
    this.taskDueDate = "";

    // Solución: Abre el modal de forma declarativa
    this.isTaskModalOpen = true;
  }

  closeModal(): void {
    // Solución: Cierra el modal cambiando el estado
    this.isTaskModalOpen = false;
  }

  // Agrega este bloque completo:
  onModalDismiss(): void {
    // El modal ya se cerró visualmente.
    // Aquí puedes limpiar variables si el usuario cerró deslizando hacia abajo.
    this.isTaskModalOpen = false;
  }

  async saveTask(): Promise<void> {
    if (!this.taskTitle.trim()) return;

    const data: Partial<Task> = {
      title: this.taskTitle.trim(),
      description: this.taskDescription.trim() || undefined,
      categoryId: this.taskCategoryId || undefined,
      priority: this.taskPriority,
      dueDate: this.taskDueDate
        ? new Date(this.taskDueDate).getTime()
        : undefined,
    };

    if (this.editingTask) {
      await this.taskService.updateTask({ ...this.editingTask, ...data });
    } else {
      await this.taskService.createTask(data);
    }

    this.closeModal();
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = {
      high: "#ff6b6b",
      medium: "#ffd43b",
      low: "#51cf66",
    };
    return map[priority] || "#6c63ff";
  }

  getCategoryById(categories: Category[], id?: string): Category | undefined {
    return categories.find((c) => c.id === id);
  }
}
