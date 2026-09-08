import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CategoriesActivitesService } from './categories-activites.service';

/**
 * Pur CRUD wrapper HTTP, aucune transformation. Couverture minimale des routes.
 */
describe('CategoriesActivitesService', () => {
  let service: CategoriesActivitesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CategoriesActivitesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() calls GET /api/categories-activites', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne('/api/categories-activites');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create() posts the payload to /api/categories-activites', () => {
    const payload = { nom: 'Nature' };
    service.create(payload).subscribe();
    const req = httpMock.expectOne('/api/categories-activites');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 1, nom: 'Nature' });
  });

  it('update() sends PUT to /api/categories-activites/:id', () => {
    service.update(1, { nom: 'Culture' }).subscribe();
    const req = httpMock.expectOne('/api/categories-activites/1');
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 1, nom: 'Culture' });
  });

  it('delete() sends DELETE to /api/categories-activites/:id', () => {
    service.delete(1).subscribe();
    const req = httpMock.expectOne('/api/categories-activites/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
