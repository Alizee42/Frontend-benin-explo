import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UtilisateurDTO {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUtilisateursService {
  private apiUrl = '/admin/utilisateurs';

  constructor(private http: HttpClient) {}

  getAll(): Observable<UtilisateurDTO[]> {
    return this.http.get<UtilisateurDTO[]>(this.apiUrl);
  }

  getById(id: number): Observable<UtilisateurDTO> {
    return this.http.get<UtilisateurDTO>(`${this.apiUrl}/${id}`);
  }

  updateRole(id: number, role: string): Observable<UtilisateurDTO> {
    return this.http.patch<UtilisateurDTO>(`${this.apiUrl}/${id}/role`, { role });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
