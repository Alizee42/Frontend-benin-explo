export interface TransportOption {
  id: string;
  label: string;
}

export const TRANSPORT_OPTIONS: TransportOption[] = [
  { id: 'compact',  label: 'Voiture compacte (1-2 personnes)' },
  { id: 'familial', label: 'Voiture familiale (3-4 personnes)' },
  { id: 'minibus',  label: 'Minibus (5-8 personnes)' },
  { id: 'bus',      label: 'Bus touristique (9+ personnes)' },
];

export interface Jour {
  numero: number;
  zoneId: number | null;
  villeId: number | null;
  activites: number[];
}

export interface OptionsGenerales {
  transportId: string;
  guide: boolean;
  chauffeur: boolean;
  pensionComplete: boolean;
}

export interface HebergementState {
  mode: 'auto' | 'choisir';
  hebergementId: number | null;
  dateArrivee: string;
  dateDepart: string;
}

export interface ContactInfo {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  message: string;
}

export function isJourComplete(jour: Jour): boolean {
  return !!(jour.zoneId && jour.villeId && jour.activites.length > 0);
}
