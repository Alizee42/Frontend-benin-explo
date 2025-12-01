import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DemandeCircuitPersonnalise {
  id: number;
  client: {
    nom: string;
    email: string;
    telephone: string;
  };
  nombrePersonnes: number;
  nombreJours: number;
  zones: string[];
  activites: string[];
  avecHebergement: boolean;
  avecTransport?: boolean;
  extras?: string[];
  statut: 'En attente' | 'Validé' | 'Refusé';
  dateCreation: string;
  prixEstime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CircuitsPersonnalisesService {

  private apiUrl = 'http://localhost:8080/api/circuits-personnalises';

  constructor(private http: HttpClient) {}

  getAllDemandes(): Observable<DemandeCircuitPersonnalise[]> {
    return this.http.get<DemandeCircuitPersonnalise[]>(this.apiUrl);
  }

  getDemandeById(id: number): Observable<DemandeCircuitPersonnalise> {
    return this.http.get<DemandeCircuitPersonnalise>(`${this.apiUrl}/${id}`);
  }

  createDemande(demande: Omit<DemandeCircuitPersonnalise, 'id' | 'dateCreation' | 'statut'>): Observable<DemandeCircuitPersonnalise> {
    return this.http.post<DemandeCircuitPersonnalise>(this.apiUrl, demande);
  }

  updateStatut(id: number, statut: DemandeCircuitPersonnalise['statut']): Observable<DemandeCircuitPersonnalise> {
    return this.http.patch<DemandeCircuitPersonnalise>(`${this.apiUrl}/${id}/statut`, { statut });
  }

  deleteDemande(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Méthode pour convertir une demande validée en circuit catalogue
  convertirEnCircuitCatalogue(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/convertir`, {});
  }
}