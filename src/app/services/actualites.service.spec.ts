import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ActualitesService } from './actualites.service';

/**
 * normalize() force aLaUne a un booleen strict, publiee par defaut a true (absence de champ =
 * publiee), et resout imageUrl. C'est la seule logique non triviale du service.
 */
describe('ActualitesService', () => {
  let service: ActualitesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ActualitesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getPublished', () => {
    it('defaults publiee to true when the field is absent', () => {
      let result: any;
      service.getPublished().subscribe(list => (result = list));

      const req = httpMock.expectOne('/api/actualites');
      req.flush([{ id: 1, titre: 'A', contenu: 'B' }]);

      expect(result[0].publiee).toBeTrue();
    });

    it('sets publiee to false only when explicitly false', () => {
      let result: any;
      service.getPublished().subscribe(list => (result = list));

      const req = httpMock.expectOne('/api/actualites');
      req.flush([{ id: 1, titre: 'A', contenu: 'B', publiee: false }]);

      expect(result[0].publiee).toBeFalse();
    });

    it('coerces aLaUne to a strict boolean', () => {
      let result: any;
      service.getPublished().subscribe(list => (result = list));

      const req = httpMock.expectOne('/api/actualites');
      req.flush([{ id: 1, titre: 'A', contenu: 'B', aLaUne: 1 }]);

      expect(result[0].aLaUne).toBeFalse();
    });
  });

  describe('resolveImage', () => {
    it('returns the fallback when raw is empty', () => {
      expect(service.resolveImage('')).toBe('assets/images/circuit-default.jpg');
      expect(service.resolveImage(null)).toBe('assets/images/circuit-default.jpg');
    });

    it('passes through absolute and protocol-relative URLs unchanged', () => {
      expect(service.resolveImage('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
      expect(service.resolveImage('//example.com/a.jpg')).toBe('//example.com/a.jpg');
    });

    it('prefixes a relative path with a leading slash', () => {
      expect(service.resolveImage('uploads/a.jpg')).toBe('/uploads/a.jpg');
    });
  });

  describe('admin CRUD', () => {
    it('getAllAdmin() calls GET /api/admin/actualites', () => {
      service.getAllAdmin().subscribe();
      const req = httpMock.expectOne('/api/admin/actualites');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('create() posts to /api/admin/actualites', () => {
      service.create({ titre: 'A', contenu: 'B' } as any).subscribe();
      const req = httpMock.expectOne('/api/admin/actualites');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 1, titre: 'A', contenu: 'B' });
    });

    it('update() sends PUT to /api/admin/actualites/:id', () => {
      service.update(1, { titre: 'A', contenu: 'B' } as any).subscribe();
      const req = httpMock.expectOne('/api/admin/actualites/1');
      expect(req.request.method).toBe('PUT');
      req.flush({ id: 1, titre: 'A', contenu: 'B' });
    });

    it('delete() sends DELETE to /api/admin/actualites/:id', () => {
      service.delete(1).subscribe();
      const req = httpMock.expectOne('/api/admin/actualites/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getPublishedById', () => {
    it('normalizes the returned dto', () => {
      let result: any;
      service.getPublishedById(1).subscribe(a => (result = a));
      const req = httpMock.expectOne('/api/actualites/1');
      req.flush({ id: 1, titre: 'A', contenu: 'B' });
      expect(result.publiee).toBeTrue();
    });
  });
});
