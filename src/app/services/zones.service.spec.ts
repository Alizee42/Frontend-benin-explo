import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ZonesService } from './zones.service';

/**
 * Pur CRUD wrapper HTTP, aucune transformation. Couverture minimale des routes.
 * (Doublon fonctionnel de ZonesAdminService sur la meme route /api/zones, cote public.)
 */
describe('ZonesService', () => {
  let service: ZonesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ZonesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAllZones() calls GET /api/zones', () => {
    service.getAllZones().subscribe();
    const req = httpMock.expectOne('/api/zones');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getZoneById() calls GET /api/zones/:id', () => {
    service.getZoneById(1).subscribe();
    const req = httpMock.expectOne('/api/zones/1');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('createZone() posts the payload to /api/zones', () => {
    const zone: any = { nom: 'Littoral', region: 'Sud', description: 'x', zonesProches: [] };
    service.createZone(zone).subscribe();
    const req = httpMock.expectOne('/api/zones');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(zone);
    req.flush(zone);
  });

  it('updateZone() sends PUT to /api/zones/:id', () => {
    service.updateZone(1, {} as any).subscribe();
    const req = httpMock.expectOne('/api/zones/1');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('deleteZone() sends DELETE to /api/zones/:id', () => {
    service.deleteZone(1).subscribe();
    const req = httpMock.expectOne('/api/zones/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
