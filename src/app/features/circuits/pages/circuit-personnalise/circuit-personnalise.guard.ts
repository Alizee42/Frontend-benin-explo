import { CanDeactivateFn } from '@angular/router';
import { CircuitPersonnaliseComponent } from './circuit-personnalise.component';

export const canDeactivateCircuitPersonnalise: CanDeactivateFn<CircuitPersonnaliseComponent> =
  (component) => {
    if (component.submitSuccess || !component.isDirty) return true;
    return window.confirm(
      'Votre circuit personnalisé est en cours de création. Quitter cette page annulera votre saisie. Voulez-vous continuer ?'
    );
  };
