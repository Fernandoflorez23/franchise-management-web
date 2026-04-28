import { TestBed } from '@angular/core/testing';
import { FirebaseService, FeatureFlags } from './firebase.service';

describe('FirebaseService', () => {
  let service: FirebaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FirebaseService] });
    service = TestBed.inject(FirebaseService);
  });

  it('should initialise with default feature flags', (done) => {
    service.featureFlags$.subscribe((flags: FeatureFlags) => {
      expect(flags.statsEnabled).toBeTrue();
      expect(flags.priorityEnabled).toBeTrue();
      expect(flags.dueDateEnabled).toBeFalse();
      done();
    });
  });

  it('should toggle a flag locally', (done) => {
    service.toggleFlagLocally('statsEnabled');
    service.featureFlags$.subscribe((flags: FeatureFlags) => {
      expect(flags.statsEnabled).toBeFalse();
      done();
    });
  });

  it('should toggle back to original value', () => {
    service.toggleFlagLocally('statsEnabled'); // false
    service.toggleFlagLocally('statsEnabled'); // true again
    expect(service.getFlag('statsEnabled')).toBeTrue();
  });

  it('should toggle dueDateEnabled independently', () => {
    service.toggleFlagLocally('dueDateEnabled');
    expect(service.getFlag('dueDateEnabled')).toBeTrue();
    // Other flags unchanged
    expect(service.getFlag('statsEnabled')).toBeTrue();
    expect(service.getFlag('priorityEnabled')).toBeTrue();
  });
});
