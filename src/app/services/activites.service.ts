import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Activite {
  id: number;
  nom: string;
  description: string;
  prix: number;
  duree: number;
  type: 'Culture' | 'Nature' | 'Aventure' | 'Détente';
  zoneId: number;
  zone?: string;
  images?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ActivitesService {

  private apiUrl = 'http://localhost:8080/api/activites';

  constructor(private http: HttpClient) {}

  getAllActivites(): Observable<Activite[]> {
    return this.http.get<Activite[]>(this.apiUrl);
  }

  getActivitesByZone(zoneId: number): Observable<Activite[]> {
    return this.http.get<Activite[]>(`${this.apiUrl}/zone/${zoneId}`);
  }

  getActiviteById(id: number): Observable<Activite> {
    return this.http.get<Activite>(`${this.apiUrl}/${id}`);
  }

  createActivite(activite: Omit<Activite, 'id'>): Observable<Activite> {
    return this.http.post<Activite>(this.apiUrl, activite);
  }

  updateActivite(id: number, activite: Partial<Activite>): Observable<Activite> {
    return this.http.put<Activite>(`${this.apiUrl}/${id}`, activite);
  }

  deleteActivite(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}