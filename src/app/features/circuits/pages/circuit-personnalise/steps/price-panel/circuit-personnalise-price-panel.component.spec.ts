import { CircuitPersonnalisePricePanelComponent } from './circuit-personnalise-price-panel.component';

/**
 * Regression pour le bug trouve en audit : si l'API tarifs echoue, tarifsOptions reste null et
 * le total transport/guide/chauffeur/pension retombe silencieusement a 0 sans avertir
 * l'utilisateur qu'il manque des couts. hasMissingTarifsForSelectedOptions() detecte ce cas
 * precis pour afficher une alerte visible dans le template.
 */
describe('CircuitPersonnalisePricePanelComponent.hasMissingTarifsForSelectedOptions', () => {
  function createComponent(): CircuitPersonnalisePricePanelComponent {
    return new CircuitPersonnalisePricePanelComponent();
  }

  it('retourne false si les tarifs sont charges, meme avec des options payantes', () => {
    const component = createComponent();
    component.tarifsOptions = { devise: 'EUR' } as any;
    component.options = { transportId: 'minibus', guide: true, chauffeur: false, pensionComplete: false };

    expect(component.hasMissingTarifsForSelectedOptions()).toBeFalse();
  });

  it('retourne false si les tarifs sont absents mais aucune option payante n est cochee', () => {
    const component = createComponent();
    component.tarifsOptions = null;
    component.options = { transportId: '', guide: false, chauffeur: false, pensionComplete: false };

    expect(component.hasMissingTarifsForSelectedOptions()).toBeFalse();
  });

  it('retourne true si les tarifs sont absents et une option payante est cochee (transport)', () => {
    const component = createComponent();
    component.tarifsOptions = null;
    component.options = { transportId: 'minibus', guide: false, chauffeur: false, pensionComplete: false };

    expect(component.hasMissingTarifsForSelectedOptions()).toBeTrue();
  });

  it('retourne true si les tarifs sont absents et le guide est coche', () => {
    const component = createComponent();
    component.tarifsOptions = null;
    component.options = { transportId: '', guide: true, chauffeur: false, pensionComplete: false };

    expect(component.hasMissingTarifsForSelectedOptions()).toBeTrue();
  });
});
