import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CircuitPersonnaliseStep3Component } from './circuit-personnalise-step3.component';
import { ReservationHebergementService } from '../../../../../../services/reservation-hebergement.service';

/**
 * Regression : la fusion de l'ancienne etape hebergement/options avec l'ancienne etape contact
 * combine deux validate() distincts. Les erreurs des deux sections doivent pouvoir s'afficher
 * simultanement (pas de court-circuit qui masquerait l'erreur contact si l'hebergement est
 * deja invalide, et vice-versa).
 */
describe('CircuitPersonnaliseStep3Component (fusion options + contact)', () => {
  function createComponent(): CircuitPersonnaliseStep3Component {
    TestBed.configureTestingModule({
      providers: [
        { provide: ReservationHebergementService, useValue: { checkDisponibilite: () => of(true) } }
      ]
    });
    return TestBed.runInInjectionContext(() => new CircuitPersonnaliseStep3Component());
  }

  it('validate() retourne false et renseigne les deux erreurs si hebergement ET contact sont incomplets', () => {
    const component = createComponent();
    component.hebergementMode = 'choisir';
    component.selectedHebergementId = null;
    component.contact = { nom: '', prenom: '', email: '', telephone: '', message: '' };

    expect(component.validate()).toBeFalse();
    expect(component.stepErrorHebergement).not.toBe('');
    expect(component.stepErrorContact).not.toBe('');
  });

  it('validate() retourne true uniquement quand hebergement (mode auto) et contact sont valides', () => {
    const component = createComponent();
    component.hebergementMode = 'auto';
    component.contact = { nom: 'Doe', prenom: 'Jane', email: 'jane@doe.com', telephone: '+229 97 00 00 00', message: '' };

    expect(component.validate()).toBeTrue();
    expect(component.stepErrorHebergement).toBe('');
    expect(component.stepErrorContact).toBe('');
  });

  it('validate() rejette un email invalide meme si hebergement est valide', () => {
    const component = createComponent();
    component.hebergementMode = 'auto';
    component.contact = { nom: 'Doe', prenom: 'Jane', email: 'pas-un-email', telephone: '+229 97 00 00 00', message: '' };

    expect(component.validate()).toBeFalse();
    expect(component.stepErrorContact).not.toBe('');
  });

  it('onSubmit() n\'emet formSubmit que si validate() est vrai', () => {
    const component = createComponent();
    component.hebergementMode = 'auto';
    component.contact = { nom: '', prenom: '', email: '', telephone: '', message: '' };
    let emitted = false;
    component.formSubmit.subscribe(() => (emitted = true));

    component.onSubmit();
    expect(emitted).toBeFalse();

    component.contact = { nom: 'Doe', prenom: 'Jane', email: 'jane@doe.com', telephone: '+229 97 00 00 00', message: '' };
    component.onSubmit();
    expect(emitted).toBeTrue();
  });

  it('ignore une reponse de disponibilite obsolete (pattern anti-race-condition)', () => {
    const component = createComponent();
    let callCount = 0;
    (component as any).reservationService = {
      checkDisponibilite: () => {
        callCount++;
        return callCount === 1 ? of(false) : of(true);
      }
    };
    component.hebergementMode = 'choisir';
    component.selectedHebergementId = 1;
    component.hebergementDateArrivee = '2026-01-01';
    component.hebergementDateDepart = '2026-01-05';

    (component as any).checkAvailability();
    (component as any).checkAvailability();

    expect(component.hebergementAvailability).toBeTrue();
  });
});
