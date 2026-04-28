import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StorageService } from './core/services/storage.service';
import { FirebaseService } from './core/services/firebase.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private storageService: StorageService,
    private firebaseService: FirebaseService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.storageService.init();
    await this.firebaseService.init();
  }
}
