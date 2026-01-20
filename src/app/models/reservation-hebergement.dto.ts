export interface ReservationHebergementDTO {
  id?: number;
  hebergementId: number;
  hebergementNom?: string;
  nomClient: string;
  prenomClient: string;
  emailClient: string;
  telephoneClient: string;
  dateArrivee: string; // Format YYYY-MM-DD
  dateDepart: string; // Format YYYY-MM-DD
  nombreNuits?: number;
  nombrePersonnes: number;
  prixTotal?: number;
  statut?: string;
  commentaires?: string;
  dateCreation?: string;
}