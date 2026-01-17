export interface CircuitProgrammeDayForm {
  day: number;
  description: string;
  approxTime?: string | null;
  mealsIncluded?: string[] | null;
  activities: number[];
  zoneId?: number | null;
  villeId?: number | null;
}

export interface CircuitPointFortForm {
  icon: string;
  title: string;
  desc: string;
}

export interface CircuitForm {
  titre: string;
  resume?: string;
  description: string;

  dureeIndicative: string;
  prixIndicatif: number;

  formuleProposee?: string;
  actif: boolean;

  zoneId?: number | null;
  villeId?: number | null;

  img: string;
  galerie: string[];

  programme: CircuitProgrammeDayForm[];

  pointsForts: CircuitPointFortForm[];
  inclus: string[];
  nonInclus: string[];
}
