import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ReservationsCircuitService } from './reservations-circuit.service';

/**
 * Pur CRUD wrapper HTTP, aucune transformation. Couverture minimale des routes.
 */
describe('ReservationsCircuitService', () => {
  let service: ReservationsCircuitService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ReservationsCircuitService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() calls GET /api/reservations', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne('/api/reservations');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getMine() calls GET /api/reservations/me', () => {
    service.getMine().subscribe();
    const req = httpMock.expectOne('/api/reservations/me');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getMineById() calls GET /api/reservations/me/:id', () => {
    service.getMineById(5).subscribe();
    const req = httpMock.expectOne('/api/reservations/me/5');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create() posts the dto to /api/reservations', () => {
    const dto: any = { nom: 'Doe', prenom: 'John', email: 'a@b.com', telephone: '123', circuitId: 1 };
    service.create(dto).subscribe();
    const req = httpMock.expectOne('/api/reservations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({});
  });

  it('update() sends PUT to /api/reservations/:id', () => {
    service.update(5, {} as any).subscribe();
    const req = httpMock.expectOne('/api/reservations/5');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('delete() sends DELETE to /api/reservations/:id', () => {
    service.delete(5).subscribe();
    const req = httpMock.expectOne('/api/reservations/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
