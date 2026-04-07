import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReservationHebergementDTO } from '../models/reservation-hebergement.dto';

export interface HebergementPayPalConfigDTO {
  enabled: boolean;
  sandbox: boolean;
  clientId: string;
  currency: string;
  brandName: string;
}

export interface HebergementPayPalOrderResponseDTO {
  reservationId: number;
  orderId: string;
  status: string;
  statutPaiement: string;
  montant: number;
  devise: string;
}

export interface HebergementPayPalCaptureResponseDTO {
  reservationId: number;
  orderId: string;
  captureId?: string;
  status: string;
  statutPaiement: string;
  reservation: ReservationHebergementDTO;
}

@Injectable({ providedIn: 'root' })
export class HebergementPaymentService {
  private readonly apiUrl = '/api/paiements/hebergement/paypal';

  constructor(private http: HttpClient) {}

  getConfig(): Observable<HebergementPayPalConfigDTO> {
    return this.http.get<HebergementPayPalConfigDTO>(`${this.apiUrl}/config`);
  }

  createOrder(
    reservationId: number,
    returnUrl?: string,
    cancelUrl?: string
  ): Observable<HebergementPayPalOrderResponseDTO> {
    return this.http.post<HebergementPayPalOrderResponseDTO>(`${this.apiUrl}/create-order`, {
      reservationId,
      returnUrl,
      cancelUrl
    });
  }

  captureOrder(reservationId: number, orderId: string): Observable<HebergementPayPalCaptureResponseDTO> {
    return this.http.post<HebergementPayPalCaptureResponseDTO>(`${this.apiUrl}/capture-order`, {
      reservationId,
      orderId
    });
  }
}
