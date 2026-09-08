import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ParametresSiteService } from './parametres-site.service';

/**
 * getPrimary() derive du premier element de getAll() : le point notable est le comportement
 * quand la liste est vide (null plutot qu'une exception ou undefined).
 */
describe('ParametresSiteService', () => {
  let service: ParametresSiteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ParametresSiteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll() calls GET /api/parametres-site', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne('/api/parametres-site');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  describe('getPrimary', () => {
    it('returns the first element of the list', () => {
      let result: any;
      service.getPrimary().subscribe(r => (result = r));
      const req = httpMock.expectOne('/api/parametres-site');
      req.flush([{ id: 1, emailContact: 'a@b.com' }, { id: 2, emailContact: 'c@d.com' }]);
      expect(result).toEqual({ id: 1, emailContact: 'a@b.com' });
    });

    it('returns null when the list is empty', () => {
      let result: any;
      service.getPrimary().subscribe(r => (result = r));
      const req = httpMock.expectOne('/api/parametres-site');
      req.flush([]);
      expect(result).toBeNull();
    });
  });
});
