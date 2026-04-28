import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  checkmarkCircleOutline,
  folderOpen,
  folderOpenOutline,
  barChart,
  barChartOutline,
} from 'ionicons/icons';
import { FirebaseService } from '../../core/services/firebase.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet, AsyncPipe],
})
export class TabsPage implements OnInit {
  statsEnabled$!: Observable<boolean>;

  constructor(private firebase: FirebaseService) {
    addIcons({
      checkmarkCircle,
      checkmarkCircleOutline,
      folderOpen,
      folderOpenOutline,
      barChart,
      barChartOutline,
    });
  }

  ngOnInit(): void {
    this.statsEnabled$ = this.firebase.featureFlags$.pipe(
      map(f => f.statsEnabled)
    );
  }
}
