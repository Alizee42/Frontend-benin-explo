import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ReservationHebergementService } from './reservation-hebergement.service';

/**
 * Pur wrapper HTTP. Cible ici les endpoints les plus a risque de faute de frappe silencieuse :
 * URLs interpolees (getMineById, getByHebergement...) et endpoints a query params
 * (checkDisponibilite, getByEmail), ou une regression ne serait visible qu'en usage reel.
 */
describe('ReservationHebergementService', () => {
  let service: ReservationHebergementService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ReservationHebergementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getMine() calls GET /api/reservations-hebergement/me', () => {
    service.getMine().subscribe();
    const req = httpMock.expectOne('/api/reservations-hebergement/me');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getMineById() calls GET /api/reservations-hebergement/me/:id', () => {
    service.getMineById(9).subscribe();
    const req = httpMock.expectOne('/api/reservations-hebergement/me/9');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getByHebergement() calls GET /api/reservations-hebergement/hebergement/:id', () => {
    service.getByHebergement(3).subscribe();
    const req = httpMock.expectOne('/api/reservations-hebergement/hebergement/3');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getBookedRangesByHebergement() calls GET /api/reservations-hebergement/indisponibilites/:id', () => {
    service.getBookedRangesByHebergement(3).subscribe();
    const req = httpMock.expectOne('/api/reservations-hebergement/indisponibilites/3');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getByStatut() calls GET /api/reservations-hebergement/statut/:statut', () => {
    service.getByStatut('CONFIRMEE').subscribe();
    const req = httpMock.expectOne('/api/reservations-hebergement/statut/CONFIRMEE');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('checkDisponibilite() sends hebergementId, dateArrivee and dateDepart as query params', () => {
    service.checkDisponibilite(3, '2026-06-01', '2026-06-05').subscribe();

    const req = httpMock.expectOne(r =>
      r.url === '/api/reservations-hebergement/disponibilite' &&
      r.params.get('hebergementId') === '3' &&
      r.params.get('dateArrivee') === '2026-06-01' &&
      r.params.get('dateDepart') === '2026-06-05'
    );
    expect(req.request.method).toBe('GET');
    req.flush(true);
  });

  it('getByEmail() sends email as a query param', () => {
    service.getByEmail('client@example.com').subscribe();

    const req = httpMock.expectOne(r =>
      r.url === '/api/reservations-hebergement/email' &&
      r.params.get('email') === 'client@example.com'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('update() sends PUT to /api/reservations-hebergement/:id', () => {
    service.update(9, {} as any).subscribe();
    const req = httpMock.expectOne('/api/reservations-hebergement/9');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
