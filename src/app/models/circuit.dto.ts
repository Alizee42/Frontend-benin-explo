export interface CircuitDTO {
  id: number;
  titre: string;
  resume: string;
  description: string;
  dureeIndicative: string;
  prixIndicatif: number;
  formuleProposee: string;
  localisation: string;
  actif: boolean;
  zoneId: number | null;
  villeId: number | null;
  villeNom: string;
  activiteIds: number[];
  img: string; // Image principale (hero image)
  galerie: string[]; // Galerie d'images (3-10 images)
  // Programme jour par jour. Peut être soit un tableau de chaînes (legacy),
  // soit un tableau d'objets structuré `ProgrammeDay`.
  programme: Array<string | ProgrammeDay>;
  tourisme?: string[]; // Lieux/attractions à visiter
  aventures?: string[]; // Activités/aventures proposées
  pointsForts: PointFort[]; // Points forts avec icône
  inclus: string[]; // Ce qui est inclus
  nonInclus: string[]; // Ce qui n'est pas inclus
}

export interface PointFort {
  icon: string;
  title: string;
  desc: string;
}

export interface ProgrammeDay {
  day: number;
  title?: string;
  approxTime?: string;
  description: string;
  mealsIncluded?: string[];
  activities?: number[]; // ids des activités
  location?: string;
  durationHours?: number;
}
