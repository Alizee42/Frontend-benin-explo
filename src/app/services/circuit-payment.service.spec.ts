import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CircuitPaymentService } from './circuit-payment.service';

/**
 * Pur wrapper HTTP (pas de logique metier propre) : le seul risque reel est une mauvaise URL
 * ou un mauvais nom de champ dans le body lors d'un futur refactoring silencieux. Verifie donc
 * que chaque appel part bien vers la bonne route avec le bon payload.
 */
describe('CircuitPaymentService', () => {
  let service: CircuitPaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CircuitPaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getConfig() calls GET /api/paiements/circuit/paypal/config', () => {
    service.getConfig().subscribe();
    const req = httpMock.expectOne('/api/paiements/circuit/paypal/config');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('createOrder() posts reservationId, returnUrl and cancelUrl', () => {
    service.createOrder(42, 'https://return', 'https://cancel').subscribe();
    const req = httpMock.expectOne('/api/paiements/circuit/paypal/create-order');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reservationId: 42, returnUrl: 'https://return', cancelUrl: 'https://cancel' });
    req.flush({});
  });

  it('captureOrder() posts reservationId and orderId', () => {
    service.captureOrder(42, 'ORDER-123').subscribe();
    const req = httpMock.expectOne('/api/paiements/circuit/paypal/capture-order');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reservationId: 42, orderId: 'ORDER-123' });
    req.flush({});
  });
});
