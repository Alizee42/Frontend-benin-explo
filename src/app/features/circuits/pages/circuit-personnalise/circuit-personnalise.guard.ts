import { CanDeactivateFn } from '@angular/router';
import { CircuitPersonnaliseComponent } from './circuit-personnalise.component';

export const canDeactivateCircuitPersonnalise: CanDeactivateFn<CircuitPersonnaliseComponent> =
  (component) => {
    if (component.submitSuccess || !component.isDirty) return true;
    return component.requestLeaveConfirmation();
  };
