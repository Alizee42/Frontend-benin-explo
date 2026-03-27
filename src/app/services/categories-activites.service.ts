import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategorieActivite {
  id: number;
  nom: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesActivitesService {

  private apiUrl = '/api/categories-activites';

  constructor(private http: HttpClient) {}

  getAll(): Observable<CategorieActivite[]> {
    return this.http.get<CategorieActivite[]>(this.apiUrl);
  }

  create(payload: { nom: string; description?: string }): Observable<CategorieActivite> {
    return this.http.post<CategorieActivite>(this.apiUrl, payload);
  }

  update(id: number, payload: { nom: string; description?: string }): Observable<CategorieActivite> {
    return this.http.put<CategorieActivite>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
