import { CircuitPersonnaliseTimelineComponent } from './circuit-personnalise-timeline.component';
import { Jour } from '../../circuit-personnalise.types';
import { Activite } from '../../../../../../services/activites.service';

/**
 * Regression pour le bug UX trouve en audit : sur un circuit long (jusqu'a 14 jours), chaque
 * jour devait etre resaisi integralement (zone/ville/activites), sans moyen de reprendre le
 * jour precedent quand plusieurs jours se ressemblent.
 */
describe('CircuitPersonnaliseTimelineComponent.copierJourPrecedent', () => {
  function createComponent(jours: Jour[]): CircuitPersonnaliseTimelineComponent {
    const component = new CircuitPersonnaliseTimelineComponent();
    component.jours = jours;
    return component;
  }

  it('peutCopierJourPrecedent renvoie false pour le premier jour', () => {
    const component = createComponent([
      { numero: 1, zoneId: null, villeId: null, activites: [] }
    ]);

    expect(component.peutCopierJourPrecedent(0)).toBeFalse();
  });

  it('peutCopierJourPrecedent renvoie false si le jour precedent est incomplet', () => {
    const component = createComponent([
      { numero: 1, zoneId: 1, villeId: null, activites: [] },
      { numero: 2, zoneId: null, villeId: null, activites: [] }
    ]);

    expect(component.peutCopierJourPrecedent(1)).toBeFalse();
  });

  it('peutCopierJourPrecedent renvoie true si le jour precedent est complet', () => {
    const component = createComponent([
      { numero: 1, zoneId: 1, villeId: 2, activites: [10] },
      { numero: 2, zoneId: null, villeId: null, activites: [] }
    ]);

    expect(component.peutCopierJourPrecedent(1)).toBeTrue();
  });

  it('copierJourPrecedent duplique zone/ville/activites vers le jour actif', (done) => {
    const jours: Jour[] = [
      { numero: 1, zoneId: 1, villeId: 2, activites: [10, 11] },
      { numero: 2, zoneId: null, villeId: null, activites: [] }
    ];
    const component = createComponent(jours);
    component.joursChange.subscribe((updated: Jour[]) => {
      expect(updated[1].zoneId).toBe(1);
      expect(updated[1].villeId).toBe(2);
      expect(updated[1].activites).toEqual([10, 11]);
      done();
    });

    component.copierJourPrecedent(1);
  });

  it('copierJourPrecedent copie un tableau independant (pas de reference partagee)', () => {
    const jours: Jour[] = [
      { numero: 1, zoneId: 1, villeId: 2, activites: [10] },
      { numero: 2, zoneId: null, villeId: null, activites: [] }
    ];
    const component = createComponent(jours);

    component.copierJourPrecedent(1);
    jours[1].activites.push(99);

    expect(jours[0].activites).toEqual([10], 'modifier le jour copie ne doit pas affecter le jour source');
  });

  it('copierJourPrecedent ne fait rien si le jour precedent est incomplet', () => {
    const jours: Jour[] = [
      { numero: 1, zoneId: null, villeId: null, activites: [] },
      { numero: 2, zoneId: 5, villeId: 6, activites: [7] }
    ];
    const component = createComponent(jours);
    let emitted = false;
    component.joursChange.subscribe(() => (emitted = true));

    component.copierJourPrecedent(1);

    expect(emitted).toBeFalse();
    expect(jours[1].zoneId).toBe(5, 'le jour cible ne doit pas etre ecrase');
  });
});

/**
 * Design change : la timeline affiche desormais tous les jours simultanement en colonnes
 * (au lieu d'un seul jour actif a la fois). La pagination des activites, deja indexee par
 * jour.numero, doit rester independante entre colonnes.
 */
describe('CircuitPersonnaliseTimelineComponent pagination independante par colonne', () => {
  function makeActivites(count: number, zoneId: number): Activite[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      nom: `Activite ${i + 1}`,
      zoneId,
      villeId: null
    } as unknown as Activite));
  }

  it("changer la page du jour 1 n'affecte pas la pagination du jour 2", () => {
    const component = new CircuitPersonnaliseTimelineComponent();
    component.jours = [
      { numero: 1, zoneId: 1, villeId: null, activites: [] },
      { numero: 2, zoneId: 1, villeId: null, activites: [] }
    ];
    component.activites = makeActivites(8, 1);

    component.changePage(0, 2);

    expect(component.getCurrentPage(0)).toBe(2);
    expect(component.getCurrentPage(1)).toBe(1);
  });
});

describe('CircuitPersonnaliseTimelineComponent.validate', () => {
  it('active le premier jour incomplet et retourne false', () => {
    const component = new CircuitPersonnaliseTimelineComponent();
    component.jours = [
      { numero: 1, zoneId: 1, villeId: 2, activites: [10] },
      { numero: 2, zoneId: null, villeId: null, activites: [] }
    ];

    expect(component.validate()).toBeFalse();
    expect(component.activeJourIndex).toBe(1);
  });

  it('validate retourne true quand tous les jours sont complets', () => {
    const component = new CircuitPersonnaliseTimelineComponent();
    component.jours = [
      { numero: 1, zoneId: 1, villeId: 2, activites: [10] }
    ];

    expect(component.validate()).toBeTrue();
  });
});

describe('CircuitPersonnaliseTimelineComponent navigation jourPrecedent/jourSuivant', () => {
  it('jourSuivant avance activeJourIndex sans depasser le dernier jour', () => {
    const component = new CircuitPersonnaliseTimelineComponent();
    component.jours = [
      { numero: 1, zoneId: null, villeId: null, activites: [] },
      { numero: 2, zoneId: null, villeId: null, activites: [] }
    ];

    component.jourSuivant();
    expect(component.activeJourIndex).toBe(1);
    component.jourSuivant();
    expect(component.activeJourIndex).toBe(1);
  });

  it('jourPrecedent recule activeJourIndex sans descendre sous 0', () => {
    const component = new CircuitPersonnaliseTimelineComponent();
    component.jours = [
      { numero: 1, zoneId: null, villeId: null, activites: [] },
      { numero: 2, zoneId: null, villeId: null, activites: [] }
    ];
    component.activeJourIndex = 1;

    component.jourPrecedent();
    expect(component.activeJourIndex).toBe(0);
    component.jourPrecedent();
    expect(component.activeJourIndex).toBe(0);
  });
});
