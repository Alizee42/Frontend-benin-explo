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
  activiteIds: number[];
  img: string; // Image principale (hero image)
  galerie: string[]; // Galerie d'images (3-10 images)
  programme: string[]; // Programme jour par jour
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
