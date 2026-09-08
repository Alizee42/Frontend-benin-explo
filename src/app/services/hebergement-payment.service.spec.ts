import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HebergementPaymentService } from './hebergement-payment.service';

/**
 * Pur wrapper HTTP (pas de logique metier propre) : le seul risque reel est une mauvaise URL
 * ou un mauvais nom de champ dans le body lors d'un futur refactoring silencieux.
 */
describe('HebergementPaymentService', () => {
  let service: HebergementPaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(HebergementPaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getConfig() calls GET /api/paiements/hebergement/paypal/config', () => {
    service.getConfig().subscribe();
    const req = httpMock.expectOne('/api/paiements/hebergement/paypal/config');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('createOrder() posts reservationId, returnUrl and cancelUrl', () => {
    service.createOrder(7, 'https://return', 'https://cancel').subscribe();
    const req = httpMock.expectOne('/api/paiements/hebergement/paypal/create-order');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reservationId: 7, returnUrl: 'https://return', cancelUrl: 'https://cancel' });
    req.flush({});
  });

  it('captureOrder() posts reservationId and orderId', () => {
    service.captureOrder(7, 'ORDER-456').subscribe();
    const req = httpMock.expectOne('/api/paiements/hebergement/paypal/capture-order');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reservationId: 7, orderId: 'ORDER-456' });
    req.flush({});
  });
});
