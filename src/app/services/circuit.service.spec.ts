import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CircuitService } from './circuit.service';

/**
 * CircuitService est surtout du CRUD simple (wrapper HTTP). Le point notable est uploadImage() :
 * accepte un parametre "folder" mais ne l'envoie jamais au backend (/api/media/upload ne le
 * supporte pas, cf. commentaire dans le service) - piege potentiel pour un futur appelant qui
 * s'attendrait a ce que le fichier soit range dans le bon dossier. Documente par un test.
 */
describe('CircuitService', () => {
  let service: CircuitService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CircuitService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAllCircuits() calls GET /api/circuits', () => {
    service.getAllCircuits().subscribe();
    const req = httpMock.expectOne('/api/circuits');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getActiveCircuits() calls GET /api/circuits/actifs', () => {
    service.getActiveCircuits().subscribe();
    const req = httpMock.expectOne('/api/circuits/actifs');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getActiveCircuitsPage() calls GET /api/circuits/actifs/page avec page, size et zoneId', () => {
    service.getActiveCircuitsPage(1, 6, 3).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/circuits/actifs/page');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('6');
    expect(req.request.params.get('zoneId')).toBe('3');
    req.flush({ content: [], page: 1, size: 6, totalElements: 0, totalPages: 0 });
  });

  it('getActiveCircuitsPage() omet zoneId quand aucune zone n est selectionnee', () => {
    service.getActiveCircuitsPage(0, 6, null).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/circuits/actifs/page');
    expect(req.request.params.has('zoneId')).toBeFalse();
    req.flush({ content: [], page: 0, size: 6, totalElements: 0, totalPages: 0 });
  });

  it('createCircuit() posts to /api/circuits', () => {
    service.createCircuit({ titre: 'Test' } as any).subscribe();
    const req = httpMock.expectOne('/api/circuits');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('deleteCircuit() sends DELETE to /api/circuits/:id', () => {
    service.deleteCircuit(5).subscribe();
    const req = httpMock.expectOne('/api/circuits/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  describe('uploadImage', () => {
    it('sends the file as multipart/form-data to /api/media/upload', () => {
      const file = new File(['content'], 'photo.png', { type: 'image/png' });

      service.uploadImage(file).subscribe();

      const req = httpMock.expectOne('/api/media/upload');
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      const sentFile = (req.request.body as FormData).get('file') as File;
      expect(sentFile.name).toBe('photo.png');
      expect(sentFile.type).toBe('image/png');
      req.flush({ id: 1, url: '/uploads/photo.png', type: 'image', description: 'photo.png' });
    });

    it('silently ignores the folder parameter (the backend endpoint does not support it)', () => {
      const file = new File(['content'], 'photo.png', { type: 'image/png' });

      service.uploadImage(file, 'circuits').subscribe();

      const req = httpMock.expectOne('/api/media/upload');
      const body = req.request.body as FormData;
      expect(body.has('folder')).toBeFalse();
      req.flush({ id: 1, url: '/uploads/photo.png', type: 'image', description: 'photo.png' });
    });
  });
});
