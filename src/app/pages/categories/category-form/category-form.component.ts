import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons,
  IonButton, IonIcon, IonContent, IonList,
  IonItem, IonLabel, IonInput,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, checkmarkCircle } from 'ionicons/icons';
import { Category } from '../../../core/models';

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

@Component({
  selector: 'app-category-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CommonModule,
    NgFor, NgIf,
    IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonContent, IonList,
    IonItem, IonLabel, IonInput,
  ],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss'],
})
export class CategoryFormComponent implements OnInit {
  @Input() editingCategory: Category | null = null;

  catName = '';
  catColor = CATEGORY_COLORS[0];
  catIcon = CATEGORY_ICONS[0];

  colors = CATEGORY_COLORS;
  icons = CATEGORY_ICONS;

  constructor(private modalCtrl: ModalController) {
    addIcons({ close, checkmarkCircle });
  }

  ngOnInit(): void {
    if (this.editingCategory) {
      this.catName = this.editingCategory.name;
      this.catColor = this.editingCategory.color;
      this.catIcon = this.editingCategory.icon;
    }
  }

  dismiss(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(): void {
    if (!this.catName.trim()) return;

    this.modalCtrl.dismiss({
      name: this.catName.trim(),
      color: this.catColor,
      icon: this.catIcon,
    }, 'confirm');
  }
}