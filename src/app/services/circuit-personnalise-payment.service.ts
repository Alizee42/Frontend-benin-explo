import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CircuitPersonnaliseDTO } from './circuits-personnalises.service';
import { PayPalClientConfig } from './paypal-sdk.service';

export interface CircuitPersonnalisePayPalOrderResponseDTO {
  demandeId: number;
  orderId: string;
  status: string;
  statutPaiement: string;
  montant: number;
  devise: string;
}

export interface CircuitPersonnalisePayPalCaptureResponseDTO {
  demandeId: number;
  orderId: string;
  captureId?: string;
  status: string;
  statutPaiement: string;
  demande: CircuitPersonnaliseDTO;
}

@Injectable({ providedIn: 'root' })
export class CircuitPersonnalisePaymentService {
  private readonly apiUrl = '/api/paiements/circuit-personnalise/paypal';

  constructor(private http: HttpClient) {}

  getConfig(): Observable<PayPalClientConfig> {
    return this.http.get<PayPalClientConfig>(`${this.apiUrl}/config`);
  }

  createOrder(
    demandeId: number,
    returnUrl?: string,
    cancelUrl?: string
  ): Observable<CircuitPersonnalisePayPalOrderResponseDTO> {
    return this.http.post<CircuitPersonnalisePayPalOrderResponseDTO>(`${this.apiUrl}/create-order`, {
      demandeId,
      returnUrl,
      cancelUrl
    });
  }

  captureOrder(demandeId: number, orderId: string): Observable<CircuitPersonnalisePayPalCaptureResponseDTO> {
    return this.http.post<CircuitPersonnalisePayPalCaptureResponseDTO>(`${this.apiUrl}/capture-order`, {
      demandeId,
      orderId
    });
  }
}
