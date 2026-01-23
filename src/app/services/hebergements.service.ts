import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MediaDTO } from './media.service';

export interface HebergementDTO {
  id: number;
  nom: string;
  type: string;
  localisation: string;
  quartier?: string;
  description: string;
  prixParNuit: number;
  imageUrls?: string[];
}

export interface Media {
  idMedia: number;
  url: string;
  type: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HebergementsService {

  private apiUrl = '/api/hebergements';

  constructor(private http: HttpClient) {}

  getAll(): Observable<HebergementDTO[]> {
    return this.http.get<HebergementDTO[]>(this.apiUrl);
  }

  getById(id: number): Observable<HebergementDTO> {
    return this.http.get<HebergementDTO>(`${this.apiUrl}/${id}`);
  }

  create(heb: Omit<HebergementDTO, 'id'>): Observable<HebergementDTO> {
    return this.http.post<HebergementDTO>(this.apiUrl, heb);
  }

  update(id: number, heb: Omit<HebergementDTO, 'id'>): Observable<HebergementDTO> {
    return this.http.put<HebergementDTO>(`${this.apiUrl}/${id}`, heb);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
