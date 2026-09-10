import { TestBed } from '@angular/core/testing';
import { canDeactivateCircuitPersonnalise } from './circuit-personnalise.guard';
import { CircuitPersonnaliseComponent } from './circuit-personnalise.component';

/**
 * Regression : window.confirm() remplace par une modale stylee pilotee par le composant
 * (requestLeaveConfirmation()), pour eviter la popup generique du navigateur au moment de
 * quitter le formulaire circuit-personnalise.
 */
describe('canDeactivateCircuitPersonnalise', () => {
  it('autorise la navigation sans demander confirmation si submitSuccess est vrai', () => {
    const component = { submitSuccess: true, isDirty: true } as CircuitPersonnaliseComponent;
    const result = TestBed.runInInjectionContext(() =>
      canDeactivateCircuitPersonnalise(component, {} as any, {} as any, {} as any)
    );
    expect(result).toBeTrue();
  });

  it('autorise la navigation sans demander confirmation si le formulaire n\'est pas dirty', () => {
    const component = { submitSuccess: false, isDirty: false } as CircuitPersonnaliseComponent;
    const result = TestBed.runInInjectionContext(() =>
      canDeactivateCircuitPersonnalise(component, {} as any, {} as any, {} as any)
    );
    expect(result).toBeTrue();
  });

  it('delegue la decision a requestLeaveConfirmation() du composant si dirty et non soumis', () => {
    const requestLeaveConfirmation = jasmine.createSpy('requestLeaveConfirmation').and.returnValue('observable-stub');
    const component = { submitSuccess: false, isDirty: true, requestLeaveConfirmation } as unknown as CircuitPersonnaliseComponent;

    const result = TestBed.runInInjectionContext(() =>
      canDeactivateCircuitPersonnalise(component, {} as any, {} as any, {} as any)
    );

    expect(requestLeaveConfirmation).toHaveBeenCalled();
    expect(result).toBe('observable-stub' as any);
  });
});
