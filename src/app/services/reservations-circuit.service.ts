import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReservationCircuitDTO {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateReservation?: string;
  circuitId: number;
  circuitNom?: string;
  statut?: string;
  nombrePersonnes?: number;
  utilisateurId?: number;
  commentaires?: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationsCircuitService {
  private apiUrl = '/api/reservations';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ReservationCircuitDTO[]> {
    return this.http.get<ReservationCircuitDTO[]>(this.apiUrl);
  }

  getMine(): Observable<ReservationCircuitDTO[]> {
    return this.http.get<ReservationCircuitDTO[]>(`${this.apiUrl}/me`);
  }

  update(id: number, dto: ReservationCircuitDTO): Observable<ReservationCircuitDTO> {
    return this.http.put<ReservationCircuitDTO>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
