import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

// Firebase Remote Config — feature flags
export interface FeatureFlags {
  statsEnabled: boolean;
  priorityEnabled: boolean;
  dueDateEnabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  statsEnabled: true,
  priorityEnabled: true,
  dueDateEnabled: false,
};

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private flagsSubject = new BehaviorSubject<FeatureFlags>(DEFAULT_FLAGS);
  featureFlags$ = this.flagsSubject.asObservable();

  private app: any = null;
  private remoteConfig: any = null;
  private initialized = false;

  async init(): Promise<void> {

    if (this.initialized) return; 
    
    try {
      // Dynamic import for tree-shaking
      const { initializeApp } = await import('firebase/app');
      const { getRemoteConfig, fetchAndActivate, getValue } = await import('firebase/remote-config');

      this.app = initializeApp(environment.firebase);
      this.remoteConfig = getRemoteConfig(this.app);

      // Minimum fetch interval (1 hour in prod, 0 in dev)
      this.remoteConfig.settings = {
        minimumFetchIntervalMillis: environment.production ? 3600000 : 0,
        fetchTimeoutMillis: 10000,
      };

      // Default values — used when fetch fails or first launch
      this.remoteConfig.defaultConfig = {
        stats_enabled: true,
        priority_enabled: true,
        due_date_enabled: false,
      };

      await fetchAndActivate(this.remoteConfig);
      this.applyFlags(getValue, this.remoteConfig);
      this.initialized = true;
    } catch (err) {
      console.warn('[Firebase] Remote Config init failed, using defaults:', err);
      // App works fine with defaults
    }
  }

  private applyFlags(getValue: Function, rc: any): void {
    const flags: FeatureFlags = {
      statsEnabled: getValue(rc, 'stats_enabled').asBoolean(),
      priorityEnabled: getValue(rc, 'priority_enabled').asBoolean(),
      dueDateEnabled: getValue(rc, 'due_date_enabled').asBoolean(),
    };
    this.flagsSubject.next(flags);
    console.log('[Firebase] Feature flags applied:', flags);
  }

  getFlag<K extends keyof FeatureFlags>(key: K): boolean {
    return this.flagsSubject.value[key];
  }

  // For demo purposes: toggle a flag locally
  toggleFlagLocally(key: keyof FeatureFlags): void {
    const current = this.flagsSubject.value;
    this.flagsSubject.next({ ...current, [key]: !current[key] });
  }
}
