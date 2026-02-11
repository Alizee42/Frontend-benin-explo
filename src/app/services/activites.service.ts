import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Activite {
  id: number;
  nom: string;
  description: string;
  prix: number | null;
  duree: number | null;
  // human-friendly display of duration (e.g. "2h30")
  dureeDisplay?: string;
  type?: 'Culture' | 'Nature' | 'Aventure' | 'Détente' | string;
  zoneId: number;
  zone?: string;
  images?: string[];
  ville?: string;
  villeId: number;
  villeNom: string;
  // resolved main image URL (absolute or relative to backend)
  image?: string | null;
  // preview url for UI (not persisted)
  imagePreview?: string | null;
  dureeMinutes?: number | null; // exact duration in minutes as received from backend (if available)
  imagePrincipaleId?: number | null;
  // display price string (EUR / XOF)
  prixDisplay?: string;
  difficulte?: string | null;
  dureeInterne?: number | null;
  poids?: number | null;
  imagePrincipaleUrl?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ActivitesService {

  private apiUrl = '/api/activites';

  constructor(private http: HttpClient) {}

  getAllActivites(): Observable<Activite[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(list => list.map(dto => this.transformDto(dto)))
    );
  }

  getActivitesByZone(zoneId: number): Observable<Activite[]> {
    return this.http.get<Activite[]>(`${this.apiUrl}/zone/${zoneId}`);
  }

  getActiviteById(id: number): Observable<Activite> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(dto => this.transformDto(dto))
    );
  }

  createActivite(activite: Partial<Omit<Activite, 'id'>>): Observable<Activite> {
    const dureeHours = (activite as any).duree ?? null;
    const dureeInterne = dureeHours != null ? Math.round(dureeHours * 60) : null; // convert hours -> minutes

    const payload: any = {
      nom: activite.nom,
      description: activite.description,
      // map frontend names to backend DTO names
      villeId: activite.villeId ?? null,
      dureeInterne: dureeInterne,
      poids: (activite as any).prix ?? null,
      difficulte: (activite as any).type ?? null,
      zoneId: activite.zoneId ?? null,
      // images are handled separately; backend expects imagePrincipaleId (nullable)
      imagePrincipaleId: (activite as any).imagePrincipaleId ?? null
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(map(dto => this.transformDto(dto)));
  }

  updateActivite(id: number, activite: Partial<Activite>): Observable<Activite> {
    const dureeHours = (activite as any).duree ?? null;
    const dureeInterne = dureeHours != null ? Math.round(dureeHours * 60) : null; // convert hours -> minutes

    const payload: any = {
      nom: activite.nom,
      description: activite.description,
      villeId: activite.villeId ?? null,
      dureeInterne: dureeInterne,
      poids: (activite as any).prix ?? null,
      difficulte: (activite as any).type ?? null,
      zoneId: activite.zoneId ?? null,
      imagePrincipaleId: (activite as any).imagePrincipaleId ?? null
    };

    return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(map(dto => this.transformDto(dto)));
  }

  private transformDto(dto: any): Activite {
    if (!dto) return null as any;
    const minutes = dto.dureeInterne != null ? dto.dureeInterne : null;
    let dureeDisplay: string | undefined = undefined;
    if (minutes != null) {
      const hh = Math.floor(minutes / 60);
      const mm = minutes % 60;
      dureeDisplay = `${hh}h${mm.toString().padStart(2, '0')}`;
    }

    const a: Activite = {
      id: dto.id,
      nom: dto.nom,
      description: dto.description,
      prix: dto.poids ?? null,
      duree: dto.dureeInterne != null ? Math.round(dto.dureeInterne / 60 * 100) / 100 : null, // hours with 2 decimals
      dureeMinutes: minutes,
      dureeDisplay,
      type: dto.difficulte ?? undefined,
      zoneId: dto.zoneId ?? 0,
      zone: undefined,
      images: undefined,
      ville: dto.villeNom ?? undefined,
      villeId: dto.villeId ?? 0,
      villeNom: dto.villeNom ?? '',
      // if backend provides a resolved image URL, use it (prefix backend host if relative)
      imagePrincipaleId: dto.imagePrincipaleId ?? null,
      image: (dto as any).imagePrincipaleUrl
        ? (() => {
          const raw = String((dto as any).imagePrincipaleUrl).trim();
          if (!raw) return null;
          if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
          return raw.startsWith('/') ? raw : `/${raw}`;
        })()
        : null
    };
    return a;
  }

  deleteActivite(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}