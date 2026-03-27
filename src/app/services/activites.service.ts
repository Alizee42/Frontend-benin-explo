import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Activite {
  id: number;
  nom: string;
  activiteType: 'ACTIVITE' | 'ATELIER';
  description: string;
  prix: number | null;
  duree: number | null;
  dureeDisplay?: string;
  /** Catégorie de l'activité (Nature, Culture, Aventure…) — vient de CategorieActivite */
  categorie?: string;
  categorieId?: number | null;
  /** Niveau de difficulté physique : Facile, Moyen, Difficile, Expert */
  difficulte?: string | null;
  zoneId: number;
  zone?: string;
  images?: string[];
  ville?: string;
  villeId: number;
  villeNom: string;
  image?: string | null;
  imagePreview?: string | null;
  dureeMinutes?: number | null;
  imagePrincipaleId?: number | null;
  prixDisplay?: string;
  dureeInterne?: number | null;
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
      type: activite.activiteType,
      description: activite.description,
      villeId: activite.villeId ?? null,
      dureeInterne: dureeInterne,
      poids: activite.prix ?? null,
      categorieId: activite.categorieId ?? null,
      difficulte: activite.difficulte ?? null,
      zoneId: activite.zoneId ?? null,
      imagePrincipaleId: (activite as any).imagePrincipaleId ?? null
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(map(dto => this.transformDto(dto)));
  }

  updateActivite(id: number, activite: Partial<Activite>): Observable<Activite> {
    const dureeHours = (activite as any).duree ?? null;
    const dureeInterne = dureeHours != null ? Math.round(dureeHours * 60) : null; // convert hours -> minutes

    const payload: any = {
      nom: activite.nom,
      type: activite.activiteType,
      description: activite.description,
      villeId: activite.villeId ?? null,
      dureeInterne: dureeInterne,
      poids: activite.prix ?? null,
      categorieId: activite.categorieId ?? null,
      difficulte: activite.difficulte ?? null,
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
      activiteType: dto.type,
      description: dto.description,
      prix: dto.poids ?? null,
      duree: dto.dureeInterne != null ? Math.round(dto.dureeInterne / 60 * 100) / 100 : null,
      dureeMinutes: minutes,
      dureeDisplay,
      categorie: dto.categorieNom ?? undefined,
      categorieId: dto.categorieId ?? null,
      difficulte: dto.difficulte ?? null,
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