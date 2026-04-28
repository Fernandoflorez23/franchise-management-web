import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonButtons, IonModal, IonItem, IonLabel, IonInput, IonList,
  IonItemSliding, IonItemOptions, IonItemOption, IonFab, IonFabButton,
  IonNote, AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add, trash, pencil, close, folderOutline, colorPaletteOutline,
  checkmarkCircle, pricetagOutline,
} from 'ionicons/icons';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { TaskService } from '../../core/services/task.service';
import { Category, Task } from '../../core/models';

// Available category colors
const CATEGORY_COLORS = [
  '#6c63ff', '#ff6b9d', '#51cf66', '#ffd43b',
  '#74c0fc', '#ff922b', '#da77f2', '#63e6be',
];

// Available category icons
const CATEGORY_ICONS = [
  'folder-outline', 'briefcase-outline', 'home-outline', 'heart-outline',
  'book-outline', 'cart-outline', 'fitness-outline', 'school-outline',
  'game-controller-outline', 'musical-notes-outline', 'airplane-outline', 'code-slash-outline',
];

interface CategoryWithCount extends Category {
  taskCount: number;
  completedCount: number;
}

@Component({
  selector: 'app-categories',
  templateUrl: 'categories.page.html',
  styleUrls: ['categories.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe, NgFor, NgIf, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
    IonButtons, IonModal, IonItem, IonLabel, IonInput, IonList,
    IonItemSliding, IonItemOptions, IonItemOption, IonFab, IonFabButton, IonNote,
  ],
})
export class CategoriesPage implements OnInit {
  categoriesWithCount$!: Observable<CategoryWithCount[]>;

  isModalOpen = false;
  editingCategory: Category | null = null;

  // Form
  catName = '';
  catColor = CATEGORY_COLORS[0];
  catIcon = CATEGORY_ICONS[0];

  colors = CATEGORY_COLORS;
  icons = CATEGORY_ICONS;

  constructor(
    private taskService: TaskService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ add, trash, pencil, close, folderOutline, colorPaletteOutline, checkmarkCircle, pricetagOutline });
  }

  ngOnInit(): void {
    this.categoriesWithCount$ = combineLatest([
      this.taskService.categories$,
      this.taskService.tasks$,
    ]).pipe(
      map(([categories, tasks]) =>
        categories.map(cat => ({
          ...cat,
          taskCount: tasks.filter(t => t.categoryId === cat.id).length,
          completedCount: tasks.filter(t => t.categoryId === cat.id && t.completed).length,
        }))
      )
    );
  }

  trackByCategoryId(_: number, cat: CategoryWithCount): string {
    return cat.id;
  }

  openNew(): void {
    this.editingCategory = null;
    this.catName = '';
    this.catColor = CATEGORY_COLORS[0];
    this.catIcon = CATEGORY_ICONS[0];
    this.isModalOpen = true;
  }

  openEdit(cat: Category, sliding?: any): void {
    sliding?.close();
    this.editingCategory = cat;
    this.catName = cat.name;
    this.catColor = cat.color;
    this.catIcon = cat.icon;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  async save(): Promise<void> {
    if (!this.catName.trim()) return;

    const data: Partial<Category> = {
      name: this.catName.trim(),
      color: this.catColor,
      icon: this.catIcon,
    };

    if (this.editingCategory) {
      await this.taskService.updateCategory({ ...this.editingCategory, ...data } as Category);
    } else {
      await this.taskService.createCategory(data);
    }
    this.closeModal();
  }

  async deleteCategory(cat: Category, sliding?: any): Promise<void> {
    await sliding?.close();
    const alert = await this.alertCtrl.create({
      header: 'Delete Category',
      message: `Delete "${cat.name}"? Tasks in this category will be unassigned.`,
      cssClass: 'custom-alert',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.taskService.deleteCategory(cat.id);
            const toast = await this.toastCtrl.create({
              message: 'Category deleted',
              duration: 1500,
              color: 'medium',
            });
            await toast.present();
          },
        },
      ],
    });
    await alert.present();
  }
}
