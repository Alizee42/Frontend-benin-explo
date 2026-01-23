import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReservationHebergementDTO } from '../models/reservation-hebergement.dto';

@Injectable({
  providedIn: 'root'
})
export class ReservationHebergementService {

  private apiUrl = '/api/reservations-hebergement';

  constructor(private http: HttpClient) { }

  getAll(): Observable<ReservationHebergementDTO[]> {
    return this.http.get<ReservationHebergementDTO[]>(this.apiUrl);
  }

  getById(id: number): Observable<ReservationHebergementDTO> {
    return this.http.get<ReservationHebergementDTO>(`${this.apiUrl}/${id}`);
  }

  create(reservation: ReservationHebergementDTO): Observable<ReservationHebergementDTO> {
    return this.http.post<ReservationHebergementDTO>(this.apiUrl, reservation);
  }

  update(id: number, reservation: ReservationHebergementDTO): Observable<ReservationHebergementDTO> {
    return this.http.put<ReservationHebergementDTO>(`${this.apiUrl}/${id}`, reservation);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getByHebergement(hebergementId: number): Observable<ReservationHebergementDTO[]> {
    return this.http.get<ReservationHebergementDTO[]>(`${this.apiUrl}/hebergement/${hebergementId}`);
  }

  getByStatut(statut: string): Observable<ReservationHebergementDTO[]> {
    return this.http.get<ReservationHebergementDTO[]>(`${this.apiUrl}/statut/${statut}`);
  }

  checkDisponibilite(hebergementId: number, dateArrivee: string, dateDepart: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/disponibilite`, {
      params: {
        hebergementId: hebergementId.toString(),
        dateArrivee,
        dateDepart
      }
    });
  }
}