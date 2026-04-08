import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReservationCircuitDTO } from './reservations-circuit.service';
import { PayPalClientConfig } from './paypal-sdk.service';

export interface CircuitPayPalOrderResponseDTO {
  reservationId: number;
  orderId: string;
  status: string;
  statutPaiement: string;
  montant: number;
  devise: string;
}

export interface CircuitPayPalCaptureResponseDTO {
  reservationId: number;
  orderId: string;
  captureId?: string;
  status: string;
  statutPaiement: string;
  reservation: ReservationCircuitDTO;
}

@Injectable({ providedIn: 'root' })
export class CircuitPaymentService {
  private readonly apiUrl = '/api/paiements/circuit/paypal';

  constructor(private http: HttpClient) {}

  getConfig(): Observable<PayPalClientConfig> {
    return this.http.get<PayPalClientConfig>(`${this.apiUrl}/config`);
  }

  createOrder(
    reservationId: number,
    returnUrl?: string,
    cancelUrl?: string
  ): Observable<CircuitPayPalOrderResponseDTO> {
    return this.http.post<CircuitPayPalOrderResponseDTO>(`${this.apiUrl}/create-order`, {
      reservationId,
      returnUrl,
      cancelUrl
    });
  }

  captureOrder(reservationId: number, orderId: string): Observable<CircuitPayPalCaptureResponseDTO> {
    return this.http.post<CircuitPayPalCaptureResponseDTO>(`${this.apiUrl}/capture-order`, {
      reservationId,
      orderId
    });
  }
}
