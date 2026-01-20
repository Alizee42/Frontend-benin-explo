import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface MediaDTO {
  id: number;
  url: string;
  type?: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  private apiUrl = 'http://localhost:8080/api/media';
  constructor(private http: HttpClient) {}

  /**
   * Retourne l'objet Media avec son `url` résolu en URL absolue si nécessaire.
   */
  get(id: number): Observable<MediaDTO> {
    return this.http.get<MediaDTO>(`${this.apiUrl}/${id}`).pipe(
      map(m => {
        if (!m) return m;
        const url = m.url || '';
        // si URL relative, préfixer avec backend
        const resolved = url.startsWith('http') ? url : `http://localhost:8080${url}`;
        return { ...m, url: resolved } as MediaDTO;
      })
    );
  }

  /**
   * Récupère et résout simplement l'URL de l'image pour un media id.
   */
  getImageUrl(id: number): Observable<string> {
    return this.get(id).pipe(map(m => (m && m.url) ? m.url : ''));
  }

  /**
   * Upload une image et retourne le MediaDTO créé.
   */
  uploadImage(file: File): Observable<MediaDTO> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<MediaDTO>(`${this.apiUrl}/upload`, formData);
  }
}
