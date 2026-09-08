import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HebergementsService } from './hebergements.service';

/**
 * Pur CRUD wrapper HTTP, aucune transformation. Couverture minimale des routes.
 */
describe('HebergementsService', () => {
  let service: HebergementsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(HebergementsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() calls GET /api/hebergements', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne('/api/hebergements');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getById() calls GET /api/hebergements/:id', () => {
    service.getById(4).subscribe();
    const req = httpMock.expectOne('/api/hebergements/4');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create() posts the payload to /api/hebergements', () => {
    const payload: any = { nom: 'Hotel A', type: 'Hotel', localisation: 'Cotonou', description: 'x', prixParNuit: 10000 };
    service.create(payload).subscribe();
    const req = httpMock.expectOne('/api/hebergements');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 1, ...payload });
  });

  it('update() sends PUT to /api/hebergements/:id', () => {
    service.update(4, {} as any).subscribe();
    const req = httpMock.expectOne('/api/hebergements/4');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('delete() sends DELETE to /api/hebergements/:id', () => {
    service.delete(4).subscribe();
    const req = httpMock.expectOne('/api/hebergements/4');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
