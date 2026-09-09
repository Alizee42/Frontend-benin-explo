import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AdminUtilisateursService } from './admin-utilisateurs.service';

/**
 * Pur CRUD wrapper HTTP. updateRole() est le point le plus recent et le plus sensible
 * (nouvel endpoint PATCH cote backend) : verifie le bon body envoye.
 */
describe('AdminUtilisateursService', () => {
  let service: AdminUtilisateursService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AdminUtilisateursService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() calls GET /api/admin/utilisateurs', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne('/api/admin/utilisateurs');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getById() calls GET /api/admin/utilisateurs/:id', () => {
    service.getById(3).subscribe();
    const req = httpMock.expectOne('/api/admin/utilisateurs/3');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('updateRole() sends PATCH with the role in the body', () => {
    service.updateRole(3, 'ADMIN').subscribe();
    const req = httpMock.expectOne('/api/admin/utilisateurs/3/role');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'ADMIN' });
    req.flush({});
  });

  it('delete() sends DELETE to /api/admin/utilisateurs/:id', () => {
    service.delete(3).subscribe();
    const req = httpMock.expectOne('/api/admin/utilisateurs/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
