import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { resolveApiUrl } from '../config/api-base-url';

export interface ActualiteDTO {
  id?: number;
  titre: string;
  contenu: string;
  resume?: string | null;
  datePublication?: string | null;
  aLaUne?: boolean;
  publiee?: boolean;
  imagePrincipaleId?: number | null;
  imageUrl?: string | null;
  auteurId?: number | null;
  auteurNom?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ActualitesService {
  private readonly publicApiUrl = '/api/actualites';
  private readonly adminApiUrl = '/api/admin/actualites';

  constructor(private http: HttpClient) {}

  getPublished(): Observable<ActualiteDTO[]> {
    return this.http.get<ActualiteDTO[]>(this.publicApiUrl).pipe(
      map((items) => (items || []).map((item) => this.normalize(item)))
    );
  }

  getPublishedById(id: number): Observable<ActualiteDTO> {
    return this.http.get<ActualiteDTO>(`${this.publicApiUrl}/${id}`).pipe(
      map((item) => this.normalize(item))
    );
  }

  getAllAdmin(): Observable<ActualiteDTO[]> {
    return this.http.get<ActualiteDTO[]>(this.adminApiUrl).pipe(
      map((items) => (items || []).map((item) => this.normalize(item)))
    );
  }

  create(dto: ActualiteDTO): Observable<ActualiteDTO> {
    return this.http.post<ActualiteDTO>(this.adminApiUrl, dto).pipe(
      map((item) => this.normalize(item))
    );
  }

  update(id: number, dto: ActualiteDTO): Observable<ActualiteDTO> {
    return this.http.put<ActualiteDTO>(`${this.adminApiUrl}/${id}`, dto).pipe(
      map((item) => this.normalize(item))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/${id}`);
  }

  resolveImage(raw?: string | null, fallback = 'assets/images/circuit-default.jpg'): string {
    const value = (raw || '').trim();
    if (!value) {
      return fallback;
    }
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//') || value.startsWith('data:')) {
      return value;
    }
    return resolveApiUrl(value.startsWith('/') ? value : `/${value}`);
  }

  private normalize(item: ActualiteDTO): ActualiteDTO {
    return {
      ...item,
      aLaUne: item.aLaUne === true,
      publiee: item.publiee !== false,
      imageUrl: this.resolveImage(item.imageUrl)
    };
  }
}
