import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ZonesAdminService } from './zones-admin.service';

/**
 * Pur CRUD wrapper HTTP, aucune transformation. Couverture minimale des routes.
 */
describe('ZonesAdminService', () => {
  let service: ZonesAdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ZonesAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() calls GET /api/zones', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne('/api/zones');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getById() calls GET /api/zones/:id', () => {
    service.getById(1).subscribe();
    const req = httpMock.expectOne('/api/zones/1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create() posts the payload to /api/zones', () => {
    const zone: any = { nom: 'Littoral', description: 'x' };
    service.create(zone).subscribe();
    const req = httpMock.expectOne('/api/zones');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(zone);
    req.flush(zone);
  });

  it('update() sends PUT to /api/zones/:id', () => {
    service.update(1, {} as any).subscribe();
    const req = httpMock.expectOne('/api/zones/1');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('delete() sends DELETE to /api/zones/:id', () => {
    service.delete(1).subscribe();
    const req = httpMock.expectOne('/api/zones/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
