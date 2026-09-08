import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CircuitPersonnalisePaymentService } from './circuit-personnalise-payment.service';

/**
 * Pur wrapper HTTP (pas de logique metier propre) : le seul risque reel est une mauvaise URL
 * ou un mauvais nom de champ dans le body lors d'un futur refactoring silencieux.
 */
describe('CircuitPersonnalisePaymentService', () => {
  let service: CircuitPersonnalisePaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CircuitPersonnalisePaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getConfig() calls GET /api/paiements/circuit-personnalise/paypal/config', () => {
    service.getConfig().subscribe();
    const req = httpMock.expectOne('/api/paiements/circuit-personnalise/paypal/config');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('createOrder() posts demandeId, returnUrl and cancelUrl', () => {
    service.createOrder(13, 'https://return', 'https://cancel').subscribe();
    const req = httpMock.expectOne('/api/paiements/circuit-personnalise/paypal/create-order');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ demandeId: 13, returnUrl: 'https://return', cancelUrl: 'https://cancel' });
    req.flush({});
  });

  it('captureOrder() posts demandeId and orderId', () => {
    service.captureOrder(13, 'ORDER-789').subscribe();
    const req = httpMock.expectOne('/api/paiements/circuit-personnalise/paypal/capture-order');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ demandeId: 13, orderId: 'ORDER-789' });
    req.flush({});
  });
});
