import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VilleDTO {
  id: number;
  nom: string;
  zoneId: number | null;
  zoneNom: string;
}

@Injectable({
  providedIn: 'root'
})
export class VillesService {

  private apiUrl = 'http://localhost:8080/api/villes';

  constructor(private http: HttpClient) { }

  getAll(): Observable<VilleDTO[]> {
    return this.http.get<VilleDTO[]>(this.apiUrl);
  }

  getByZone(zoneId: number): Observable<VilleDTO[]> {
    return this.http.get<VilleDTO[]>(`${this.apiUrl}/zone/${zoneId}`);
  }

  getById(id: number): Observable<VilleDTO> {
    return this.http.get<VilleDTO>(`${this.apiUrl}/${id}`);
  }

  create(ville: VilleDTO): Observable<VilleDTO> {
    return this.http.post<VilleDTO>(this.apiUrl, ville);
  }

  update(id: number, ville: VilleDTO): Observable<VilleDTO> {
    return this.http.put<VilleDTO>(`${this.apiUrl}/${id}`, ville);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}