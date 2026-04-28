import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AsyncPipe, NgFor, NgIf, DecimalPipe } from '@angular/common';
import { TitleCasePipe } from '../../shared/pipes/titlecase.pipe';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonIcon,
  IonButton, IonChip, IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trophyOutline, checkmarkCircleOutline, timeOutline,
  flashOutline, barChartOutline, statsChartOutline, sparkles,
  toggleOutline,
} from 'ionicons/icons';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { TaskService } from '../../core/services/task.service';
import { FirebaseService, FeatureFlags } from '../../core/services/firebase.service';
import { TaskStats } from '../../core/models';

@Component({
  selector: 'app-stats',
  templateUrl: 'stats.page.html',
  styleUrls: ['stats.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe, NgFor, NgIf, DecimalPipe, TitleCasePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonChip, IonLabel,
  ],
})
export class StatsPage implements OnInit {
  stats$!: Observable<TaskStats>;
  flags$!: Observable<FeatureFlags>;
  statsEnabled$!: Observable<boolean>;

  constructor(
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    public firebase: FirebaseService,
  ) {
    addIcons({
      trophyOutline, checkmarkCircleOutline, timeOutline,
      flashOutline, barChartOutline, statsChartOutline, sparkles, toggleOutline,
    });
  }

  ngOnInit(): void {
    this.stats$ = this.taskService.getStats();
    this.flags$ = this.firebase.featureFlags$;
    this.statsEnabled$ = this.flags$.pipe(map(f => f.statsEnabled));
  }

  toggleStatsFlag(): void {
    this.firebase.toggleFlagLocally('statsEnabled');
    this.cdr.markForCheck();
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = { high: '#ff6b6b', medium: '#ffd43b', low: '#51cf66' };
    return map[priority] || '#6c63ff';
  }

  getPriorityWidth(count: number, total: number): number {
    return total > 0 ? (count / total) * 100 : 0;
  }
}
