import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { VillesService } from './villes.service';

/**
 * Pur CRUD wrapper HTTP, aucune transformation. Couverture minimale des routes.
 */
describe('VillesService', () => {
  let service: VillesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(VillesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() calls GET /api/villes', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne('/api/villes');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getByZone() calls GET /api/villes/zone/:id', () => {
    service.getByZone(2).subscribe();
    const req = httpMock.expectOne('/api/villes/zone/2');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getById() calls GET /api/villes/:id', () => {
    service.getById(2).subscribe();
    const req = httpMock.expectOne('/api/villes/2');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create() posts the payload to /api/villes', () => {
    const ville: any = { id: 0, nom: 'Cotonou', zoneId: 1, zoneNom: 'Littoral' };
    service.create(ville).subscribe();
    const req = httpMock.expectOne('/api/villes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(ville);
    req.flush(ville);
  });

  it('update() sends PUT to /api/villes/:id', () => {
    service.update(2, {} as any).subscribe();
    const req = httpMock.expectOne('/api/villes/2');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('delete() sends DELETE to /api/villes/:id', () => {
    service.delete(2).subscribe();
    const req = httpMock.expectOne('/api/villes/2');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
