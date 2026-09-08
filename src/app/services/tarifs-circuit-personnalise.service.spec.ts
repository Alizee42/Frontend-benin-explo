import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TarifsCircuitPersonnaliseService } from './tarifs-circuit-personnalise.service';

/**
 * save() bascule entre PUT et POST selon la presence d'un id : un point de bascule facile a
 * casser silencieusement (ex: creer un doublon au lieu de mettre a jour). Seul point non trivial
 * du service.
 */
describe('TarifsCircuitPersonnaliseService', () => {
  let service: TarifsCircuitPersonnaliseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TarifsCircuitPersonnaliseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getCurrent() calls GET /api/tarifs-circuit-personnalise', () => {
    service.getCurrent().subscribe();
    const req = httpMock.expectOne('/api/tarifs-circuit-personnalise');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  describe('save', () => {
    it('sends POST to the base URL when the dto has no id', () => {
      const tarifs: any = { devise: 'XOF', transportCompactParJour: 1000 };
      service.save(tarifs).subscribe();
      const req = httpMock.expectOne('/api/tarifs-circuit-personnalise');
      expect(req.request.method).toBe('POST');
      req.flush(tarifs);
    });

    it('sends PUT to /:id when the dto has an id', () => {
      const tarifs: any = { id: 7, devise: 'XOF', transportCompactParJour: 1000 };
      service.save(tarifs).subscribe();
      const req = httpMock.expectOne('/api/tarifs-circuit-personnalise/7');
      expect(req.request.method).toBe('PUT');
      req.flush(tarifs);
    });
  });
});
