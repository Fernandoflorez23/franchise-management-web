import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from "@angular/common";
import { IonRouterOutlet } from '@ionic/angular/standalone';
import { FormsModule } from "@angular/forms";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonInput,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonFab,
  IonFabButton,
  IonNote,
  AlertController,
  ToastController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  add,
  trash,
  pencil,
  close,
  folderOutline,
  colorPaletteOutline,
  checkmarkCircle,
  pricetagOutline,
} from "ionicons/icons";
import { Observable, combineLatest, Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";

import { TaskService } from "../../core/services/task.service";
import { Category, Task } from "../../core/models";

interface CategoryWithCount extends Category {
  taskCount: number;
  completedCount: number;
}

const CATEGORY_COLORS = [
  "#6c63ff",
  "#ff6b9d",
  "#51cf66",
  "#ffd43b",
  "#74c0fc",
  "#ff922b",
  "#da77f2",
  "#63e6be",
];

const CATEGORY_ICONS = [
  "folder-outline",
  "briefcase-outline",
  "home-outline",
  "heart-outline",
  "book-outline",
  "cart-outline",
  "fitness-outline",
  "school-outline",
  "game-controller-outline",
  "musical-notes-outline",
  "airplane-outline",
  "code-slash-outline",
];

@Component({
  selector: "app-categories",
  templateUrl: "categories.page.html",
  styleUrls: ["categories.page.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    NgFor,
    NgIf,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonButtons,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonInput,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonFab,
    IonFabButton,
    IonNote,
  ],
})
export class CategoriesPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  categoriesWithCount$!: Observable<CategoryWithCount[]>;

  // Modal state
  isModalOpen = false;
  editingCategory: Category | null = null;

  // Form fields
  catName = "";
  catColor = CATEGORY_COLORS[0];
  catIcon = CATEGORY_ICONS[0];

  colors = CATEGORY_COLORS;
  icons = CATEGORY_ICONS;

  constructor(
    private taskService: TaskService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({
      add,
      trash,
      pencil,
      close,
      folderOutline,
      colorPaletteOutline,
      checkmarkCircle,
      pricetagOutline,
    });
  }

ngOnInit(): void {
  this.categoriesWithCount$ = combineLatest([
    this.taskService.categories$,
    this.taskService.tasks$,
  ]).pipe(
    takeUntil(this.destroy$),
    map(([categories, tasks]) =>
      categories.map(cat => ({
        ...cat,
        taskCount: tasks.filter(t => t.categoryId === cat.id).length,
        completedCount: tasks.filter(t => t.categoryId === cat.id && t.completed).length,
      }))
    )
  );
}

// Agrega este método — se ejecuta CADA VEZ que el tab se activa
ionViewWillEnter(): void {
  // Elimina cualquier backdrop huérfano que Home haya dejado
  document.body.classList.remove('backdrop-no-scroll');
  document.querySelectorAll('ion-backdrop').forEach(el => el.remove());
  
  // Cierra cualquier modal que haya quedado abierto
  document.querySelectorAll('ion-modal').forEach((el: any) => {
    if (el.isOpen) el.dismiss();
  });
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByCategoryId(_: number, cat: CategoryWithCount): string {
    return cat.id;
  }

  openNew(): void {
    console.log("openNew called, isModalOpen before:", this.isModalOpen);
    this.editingCategory = null;
    this.catName = "";
    this.catColor = CATEGORY_COLORS[0];
    this.catIcon = CATEGORY_ICONS[0];
    this.isModalOpen = true;
    console.log("isModalOpen after:", this.isModalOpen);
    this.cdr.detectChanges();
    console.log("detectChanges called");
  }

  openEdit(cat: Category, sliding?: any): void {
    sliding?.close();
    this.editingCategory = cat;
    this.catName = cat.name;
    this.catColor = cat.color;
    this.catIcon = cat.icon;
    this.isModalOpen = true;
    this.cdr.detectChanges(); // ← sincrónico
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.cdr.detectChanges(); // ← sincrónico
  }

  onModalDismiss(): void {
    this.isModalOpen = false;
    this.cdr.detectChanges(); // ← sincrónico
  }

  async saveCategory(): Promise<void> {
    if (!this.catName.trim()) return;

    const data = {
      name: this.catName.trim(),
      color: this.catColor,
      icon: this.catIcon,
    };

    if (this.editingCategory) {
      await this.taskService.updateCategory({
        ...this.editingCategory,
        ...data,
      });
    } else {
      await this.taskService.createCategory(data);
    }

    this.closeModal();
  }

  async deleteCategory(cat: Category, sliding?: any): Promise<void> {
    await sliding?.close();
    const alert = await this.alertCtrl.create({
      header: "Delete Category",
      message: `Delete "${cat.name}"? Tasks in this category will be unassigned.`,
      cssClass: "custom-alert",
      buttons: [
        { text: "Cancel", role: "cancel" },
        {
          text: "Delete",
          role: "destructive",
          handler: async () => {
            await this.taskService.deleteCategory(cat.id);
            const toast = await this.toastCtrl.create({
              message: "Category deleted",
              duration: 1500,
              color: "medium",
            });
            await toast.present();
          },
        },
      ],
    });
    await alert.present();
  }
}
