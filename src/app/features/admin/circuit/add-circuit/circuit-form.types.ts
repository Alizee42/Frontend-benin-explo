export interface ProgrammeJour {
  jour: number;
  title?: string;
  description: string;
  zoneId: number | null;
  villeId: number | null;
  activiteIds: number[];
}

export interface PointFort {
  icon: string;
  title: string;
  desc: string;
}

export interface CircuitFormData {
  titre: string;
  description: string;
  dureeJours: number;
  prixEuros: number;
  priceCurrency: 'EUR' | 'XOF';
  imageHero: File | null;
  imagesGalerie: File[];
  programme: ProgrammeJour[];
  pointsForts: PointFort[];
  inclus: string[];
  nonInclus: string[];
}
