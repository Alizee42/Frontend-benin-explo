import { TestBed } from '@angular/core/testing';
import { CircuitPersonnaliseDraftService } from './circuit-personnalise-draft.service';
import { Jour, OptionsGenerales, HebergementState, ContactInfo } from './circuit-personnalise.types';

/**
 * Regression pour le bug UX trouve en audit : le formulaire circuit-personnalise (jusqu'a 14
 * jours de planning) ne persistait rien, un refresh accidentel effacait toute la saisie.
 */
describe('CircuitPersonnaliseDraftService', () => {
  let service: CircuitPersonnaliseDraftService;

  const jours: Jour[] = [{ numero: 1, zoneId: 1, villeId: 2, activites: [3, 4] }];
  const options: OptionsGenerales = { transportId: 'minibus', guide: true, chauffeur: false, pensionComplete: false };
  const hebergementState: HebergementState = { mode: 'auto', hebergementId: null, dateArrivee: '', dateDepart: '' };
  const contact: ContactInfo = { nom: 'Doe', prenom: 'Jane', email: 'jane@example.com', telephone: '+22900000000', message: '' };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CircuitPersonnaliseDraftService);
    sessionStorage.clear();
  });

  afterEach(() => sessionStorage.clear());

  it('renvoie null si aucun brouillon n a ete sauvegarde', () => {
    expect(service.load()).toBeNull();
  });

  it('sauvegarde puis recharge fidelement toute la progression', () => {
    service.save({ etape: 3, nombreJours: 2, nombrePersonnes: 2, dateVoyageSouhaitee: '2026-10-01', jours, options, hebergementState, contact });

    const loaded = service.load();

    expect(loaded?.etape).toBe(3);
    expect(loaded?.nombreJours).toBe(2);
    expect(loaded?.dateVoyageSouhaitee).toBe('2026-10-01');
    expect(loaded?.jours).toEqual(jours);
    expect(loaded?.options).toEqual(options);
    expect(loaded?.contact).toEqual(contact);
  });

  it('ignore un brouillon perime (> 24h)', () => {
    service.save({ etape: 2, nombreJours: 1, nombrePersonnes: 1, dateVoyageSouhaitee: '', jours, options, hebergementState, contact });
    const raw = sessionStorage.getItem('circuit-personnalise-draft');
    const parsed = JSON.parse(raw!);
    parsed.savedAt = Date.now() - 25 * 60 * 60 * 1000; // 25h dans le passe
    sessionStorage.setItem('circuit-personnalise-draft', JSON.stringify(parsed));

    expect(service.load()).toBeNull();
  });

  it('clear() supprime le brouillon sauvegarde', () => {
    service.save({ etape: 2, nombreJours: 1, nombrePersonnes: 1, dateVoyageSouhaitee: '', jours, options, hebergementState, contact });
    service.clear();

    expect(service.load()).toBeNull();
  });

  it('ne leve pas d exception si sessionStorage.setItem echoue', () => {
    spyOn(sessionStorage, 'setItem').and.throwError('quota exceeded');

    expect(() => service.save({ etape: 1, nombreJours: 1, nombrePersonnes: 1, dateVoyageSouhaitee: '', jours, options, hebergementState, contact })).not.toThrow();
  });
});
