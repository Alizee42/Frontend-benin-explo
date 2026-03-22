import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JourDTO {
  id?: number;
  numeroJour: number;
  zoneId?: number;
  zoneNom?: string;
  villeId?: number;
  villeNom?: string;
  activiteIds: number[];
  activiteNoms?: string[];
  descriptionJour?: string;
}

export interface CircuitPersonnaliseDTO {
  id?: number;
  
  // Client
  nomClient: string;
  prenomClient: string;
  emailClient: string;
  telephoneClient: string;
  messageClient?: string;
  
  // Paramètres
  nombreJours: number;
  nombrePersonnes: number;
  dateCreation?: string;
  dateVoyageSouhaitee?: string;

  // Options
  avecHebergement: boolean;
  typeHebergement?: string;
  hebergementId?: number;
  hebergementNom?: string;
  hebergementLocalisation?: string;
  hebergementPrixParNuit?: number;
  dateArriveeHebergement?: string;
  dateDepartHebergement?: string;
  nombreNuitsHebergement?: number;
  avecTransport: boolean;
  typeTransport?: string;
  avecGuide: boolean;
  avecChauffeur: boolean;
  pensionComplete: boolean;
  
  // Prix
  prixActivitesEstime?: number;
  prixHebergementEstime?: number;
  prixTransportEstime?: number;
  prixGuideEstime?: number;
  prixChauffeurEstime?: number;
  prixPensionCompleteEstime?: number;
  prixEstime?: number;
  devisePrixEstime?: string;
  prixFinal?: number;
  
  // Statut
  statut?: string;
  dateTraitement?: string;
  commentaireAdmin?: string;
  motifRefus?: string;
  
  // Jours
  jours: JourDTO[];
  
  // Circuit créé
  circuitCreeId?: number;
}

// Legacy interface pour compatibilité
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

  private apiUrl = '/api/circuits-personnalises';

  constructor(private http: HttpClient) {}

  getAllDemandes(): Observable<CircuitPersonnaliseDTO[]> {
    return this.http.get<CircuitPersonnaliseDTO[]>(this.apiUrl);
  }

  getDemandesByStatut(statut: string): Observable<CircuitPersonnaliseDTO[]> {
    return this.http.get<CircuitPersonnaliseDTO[]>(`${this.apiUrl}?statut=${statut}`);
  }

  getDemandeById(id: number): Observable<CircuitPersonnaliseDTO> {
    return this.http.get<CircuitPersonnaliseDTO>(`${this.apiUrl}/${id}`);
  }

  createDemande(demande: CircuitPersonnaliseDTO): Observable<CircuitPersonnaliseDTO> {
    return this.http.post<CircuitPersonnaliseDTO>(this.apiUrl, demande);
  }

  updateStatut(
    id: number,
    statut: string,
    prixFinal?: number,
    commentaireAdmin?: string,
    motifRefus?: string,
    emailSubject?: string,
    emailBody?: string
  ): Observable<CircuitPersonnaliseDTO> {
    const body: any = { statut };
    if (prixFinal !== undefined) {
      body.prixFinal = prixFinal;
    }
    if (commentaireAdmin !== undefined) {
      body.commentaireAdmin = commentaireAdmin;
    }
    if (motifRefus !== undefined) {
      body.motifRefus = motifRefus;
    }
    if (emailSubject !== undefined) {
      body.emailSubject = emailSubject;
    }
    if (emailBody !== undefined) {
      body.emailBody = emailBody;
    }
    return this.http.patch<CircuitPersonnaliseDTO>(`${this.apiUrl}/${id}/statut`, body);
  }

  deleteDemande(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
