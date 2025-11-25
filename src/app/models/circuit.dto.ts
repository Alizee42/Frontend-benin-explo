export interface CircuitDTO {
  id: number;
  nom: string;
  description: string;
  dureeIndicative: string;
  prixIndicatif: number;
  formuleProposee: string;
  niveau: string;
  zoneId: number;
  activiteIds: number[];
}
