import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ActivitesService } from './activites.service';

/**
 * transformDto() convertit duree (heures, cote UI) <-> dureeInterne (minutes, cote backend) et
 * construit dureeDisplay / image : logique la plus a risque de regression silencieuse du service,
 * jamais testee jusqu'ici.
 */
describe('ActivitesService', () => {
  let service: ActivitesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ActivitesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getAllActivites', () => {
    it('transforms dureeInterne (minutes) into duree (hours) and dureeDisplay', () => {
      let result: any;
      service.getAllActivites().subscribe(list => (result = list));

      const req = httpMock.expectOne('/api/activites');
      req.flush([{ id: 1, nom: 'Rando', type: 'ACTIVITE', dureeInterne: 90, poids: 1000 }]);

      expect(result[0].duree).toBe(1.5);
      expect(result[0].dureeMinutes).toBe(90);
      expect(result[0].dureeDisplay).toBe('1h30');
      expect(result[0].prix).toBe(1000);
    });

    it('leaves duree/dureeDisplay undefined when dureeInterne is absent', () => {
      let result: any;
      service.getAllActivites().subscribe(list => (result = list));

      const req = httpMock.expectOne('/api/activites');
      req.flush([{ id: 1, nom: 'Rando', type: 'ACTIVITE' }]);

      expect(result[0].duree).toBeNull();
      expect(result[0].dureeDisplay).toBeUndefined();
    });

    it('resolves a relative imagePrincipaleUrl by prefixing a leading slash', () => {
      let result: any;
      service.getAllActivites().subscribe(list => (result = list));

      const req = httpMock.expectOne('/api/activites');
      req.flush([{ id: 1, imagePrincipaleUrl: 'uploads/photo.jpg' }]);

      expect(result[0].image).toBe('/uploads/photo.jpg');
    });

    it('passes through an absolute imagePrincipaleUrl unchanged', () => {
      let result: any;
      service.getAllActivites().subscribe(list => (result = list));

      const req = httpMock.expectOne('/api/activites');
      req.flush([{ id: 1, imagePrincipaleUrl: 'https://cdn.example.com/photo.jpg' }]);

      expect(result[0].image).toBe('https://cdn.example.com/photo.jpg');
    });
  });

  describe('createActivite', () => {
    it('converts duree from hours to dureeInterne minutes and maps prix -> poids in the payload', () => {
      service.createActivite({ nom: 'Rando', duree: 1.5, prix: 1000 } as any).subscribe();

      const req = httpMock.expectOne('/api/activites');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.dureeInterne).toBe(90);
      expect(req.request.body.poids).toBe(1000);
      req.flush({ id: 1 });
    });
  });

  describe('updateActivite', () => {
    it('sends PUT to /api/activites/:id with converted duree', () => {
      service.updateActivite(1, { duree: 2 } as any).subscribe();

      const req = httpMock.expectOne('/api/activites/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.dureeInterne).toBe(120);
      req.flush({ id: 1 });
    });
  });

  describe('deleteActivite', () => {
    it('sends DELETE to /api/activites/:id', () => {
      service.deleteActivite(1).subscribe();
      const req = httpMock.expectOne('/api/activites/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getActivitesByZone / getActiviteById', () => {
    it('getActivitesByZone() calls GET /api/activites/zone/:id', () => {
      service.getActivitesByZone(3).subscribe();
      const req = httpMock.expectOne('/api/activites/zone/3');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getActiviteById() transforms the returned dto', () => {
      let result: any;
      service.getActiviteById(1).subscribe(a => (result = a));
      const req = httpMock.expectOne('/api/activites/1');
      req.flush({ id: 1, dureeInterne: 60 });
      expect(result.duree).toBe(1);
    });
  });
});
