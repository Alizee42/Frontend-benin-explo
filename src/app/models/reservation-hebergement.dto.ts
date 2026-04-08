export interface ReservationHebergementDTO {
  id?: number;
  referenceReservation?: string;
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
  utilisateurId?: number;
  statutPaiement?: string;
  montantPaye?: number;
  devisePaiement?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  datePaiement?: string;
  commentaires?: string;
  dateCreation?: string;
}
