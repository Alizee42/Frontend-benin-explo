import { AddCircuitStep3Component } from './add-circuit-step3.component';
import { Activite } from '../../../../../services/activites.service';
import { CircuitFormData } from '../circuit-form.types';

/**
 * Regression pour la refonte des cartes d'activite (etape Programme) : la logique
 * toggleActivite/isActiviteSelected ne change pas, seul le template passe de checkbox
 * brute a carte cliquable avec vignette optionnelle.
 */
describe('AddCircuitStep3Component', () => {
  function makeCircuit(): CircuitFormData {
    return {
      titre: '', description: '', dureeJours: 1, prixEuros: 0, priceCurrency: 'EUR',
      imageHero: null, imagesGalerie: [],
      programme: [{ jour: 1, title: '', description: '', zoneId: 1, villeId: 2, activiteIds: [] }],
      pointsForts: [], inclus: [], nonInclus: []
    };
  }

  function makeActivite(overrides: Partial<Activite> = {}): Activite {
    return {
      id: 1, nom: 'Visite test', activiteType: 'ACTIVITE', description: 'desc',
      prix: 10, duree: 2, zoneId: 1, villeId: 2, villeNom: 'Cotonou',
      image: null,
      ...overrides
    } as Activite;
  }

  function createComponent(): AddCircuitStep3Component {
    const component = new AddCircuitStep3Component();
    component.circuit = makeCircuit();
    return component;
  }

  it('toggleActivite ajoute puis retire l\'id de activiteIds', () => {
    const component = createComponent();

    component.toggleActivite(0, 5);
    expect(component.isActiviteSelected(0, 5)).toBeTrue();
    expect(component.circuit.programme[0].activiteIds).toEqual([5]);

    component.toggleActivite(0, 5);
    expect(component.isActiviteSelected(0, 5)).toBeFalse();
    expect(component.circuit.programme[0].activiteIds).toEqual([]);
  });

  it('isActiviteSelected reflete l\'etat courant sans dependre du rendu carte', () => {
    const component = createComponent();
    component.circuit.programme[0].activiteIds = [7, 9];

    expect(component.isActiviteSelected(0, 7)).toBeTrue();
    expect(component.isActiviteSelected(0, 8)).toBeFalse();
    expect(component.isActiviteSelected(0, 9)).toBeTrue();
  });

  it('getActivitesForJour filtre par ville quand villeId est defini', () => {
    const component = createComponent();
    component.activitesParJour = {
      0: [
        makeActivite({ id: 1, villeId: 2 }),
        makeActivite({ id: 2, villeId: 3 })
      ]
    };

    const result = component.getActivitesForJour(0);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  it('conserve les activites avec image null sans planter (pas de vignette rendue)', () => {
    const component = createComponent();
    component.activitesParJour = { 0: [makeActivite({ image: null })] };

    const activites = component.getActivitesForJour(0);

    expect(activites[0].image).toBeNull();
  });
});
