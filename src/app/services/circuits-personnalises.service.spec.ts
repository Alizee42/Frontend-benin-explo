import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CircuitsPersonnalisesService } from './circuits-personnalises.service';

/**
 * updateStatut() construit son body en n'ajoutant que les champs definis (prixFinal,
 * commentaireAdmin, motifRefus, emailSubject, emailBody) : un futur refactoring pourrait
 * facilement envoyer un champ non voulu ou en oublier un. C'est le seul point non trivial
 * du service, le reste est du CRUD pur.
 */
describe('CircuitsPersonnalisesService', () => {
  let service: CircuitsPersonnalisesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CircuitsPersonnalisesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAllDemandes() calls GET /api/circuits-personnalises', () => {
    service.getAllDemandes().subscribe();
    const req = httpMock.expectOne('/api/circuits-personnalises');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getDemandesByStatut() appends statut as a query string', () => {
    service.getDemandesByStatut('EN_ATTENTE').subscribe();
    const req = httpMock.expectOne('/api/circuits-personnalises?statut=EN_ATTENTE');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getMineDemandes() calls GET /api/circuits-personnalises/me', () => {
    service.getMineDemandes().subscribe();
    const req = httpMock.expectOne('/api/circuits-personnalises/me');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getMineDemandeById() calls GET /api/circuits-personnalises/me/:id', () => {
    service.getMineDemandeById(3).subscribe();
    const req = httpMock.expectOne('/api/circuits-personnalises/me/3');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('createDemande() posts the full dto to /api/circuits-personnalises', () => {
    const demande: any = { nomClient: 'Doe', jours: [] };
    service.createDemande(demande).subscribe();
    const req = httpMock.expectOne('/api/circuits-personnalises');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(demande);
    req.flush({});
  });

  it('deleteDemande() sends DELETE to /api/circuits-personnalises/:id', () => {
    service.deleteDemande(3).subscribe();
    const req = httpMock.expectOne('/api/circuits-personnalises/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  describe('updateStatut', () => {
    it('sends only statut when no optional field is provided', () => {
      service.updateStatut(3, 'VALIDE').subscribe();
      const req = httpMock.expectOne('/api/circuits-personnalises/3/statut');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ statut: 'VALIDE' });
      req.flush({});
    });

    it('includes prixFinal and commentaireAdmin only when provided', () => {
      service.updateStatut(3, 'VALIDE', 50000, 'ok pour moi').subscribe();
      const req = httpMock.expectOne('/api/circuits-personnalises/3/statut');
      expect(req.request.body).toEqual({ statut: 'VALIDE', prixFinal: 50000, commentaireAdmin: 'ok pour moi' });
      req.flush({});
    });

    it('includes motifRefus and email fields when provided', () => {
      service.updateStatut(3, 'REFUSE', undefined, undefined, 'indisponible', 'Sujet', 'Corps').subscribe();
      const req = httpMock.expectOne('/api/circuits-personnalises/3/statut');
      expect(req.request.body).toEqual({
        statut: 'REFUSE',
        motifRefus: 'indisponible',
        emailSubject: 'Sujet',
        emailBody: 'Corps'
      });
      req.flush({});
    });
  });
});
