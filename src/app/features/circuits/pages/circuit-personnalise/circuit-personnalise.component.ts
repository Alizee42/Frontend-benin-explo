import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface Zone {
  id: number;
  nom: string;
  region: string;
  description: string;
}

interface Activite {
  id: number;
  nom: string;
  description: string;
  zoneIds: number[]; // zones où cette activité est disponible
  duree: string;
  prix: number;
}

interface Jour {
  numero: number;
  zones: Zone[];
  activites: Activite[];
}

interface OptionsGenerales {
  hebergement: string;
  transport: string;
  guide: boolean;
  chauffeur: boolean;
  pensionComplete: boolean;
}

interface DemandeCircuit {
  nombreJours: number;
  nombrePersonnes: number;
  jours: Jour[];
  options: OptionsGenerales;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  message: string;
}

@Component({
  selector: 'app-circuit-personnalise',
  imports: [CommonModule, FormsModule],
  templateUrl: './circuit-personnalise.component.html',
  styleUrl: './circuit-personnalise.component.scss'
})
export class CircuitPersonnaliseComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Étapes du formulaire
  etape = 1; // 1: durée, 2: jours, 3: options, 4: résumé, 5: formulaire

  // Données mock
  zones: Zone[] = [
    { id: 1, nom: 'Cotonou', region: 'Sud', description: 'Capitale économique' },
    { id: 2, nom: 'Porto-Novo', region: 'Sud', description: 'Capitale politique' },
    { id: 3, nom: 'Ouidah', region: 'Sud', description: 'Ville historique' },
    { id: 4, nom: 'Abomey', region: 'Centre', description: 'Ancienne capitale royale' },
    { id: 5, nom: 'Parakou', region: 'Nord', description: 'Centre commercial' },
    { id: 6, nom: 'Natitingou', region: 'Nord', description: 'Porte du Nord' }
  ];

  hebergements: string[] = [
    'Airbnb Villa Luxe Cotonou',
    'Airbnb Appartement Centre Porto-Novo',
    'Airbnb Maison Traditionnelle Ouidah',
    'Airbnb Hôtel Boutique Abomey',
    'Airbnb Lodge Nature Parakou',
    'Airbnb Écolodge Natitingou'
  ];

  transports: string[] = [
    'Voiture compacte (1-2 personnes)',
    'Voiture familiale (3-4 personnes)',
    'Minibus (5-8 personnes)',
    'Bus touristique (9+ personnes)'
  ];

  activites: Activite[] = [
    { id: 1, nom: 'Visite du marché Dantokpa', description: 'Plus grand marché d\'Afrique de l\'Ouest', zoneIds: [1], duree: '2h', prix: 20 },
    { id: 2, nom: 'Musée Honmé', description: 'Histoire du royaume du Dahomey', zoneIds: [4], duree: '1.5h', prix: 15 },
    { id: 3, nom: 'Route des Esclaves', description: 'Circuit historique de la traite', zoneIds: [3], duree: '3h', prix: 25 },
    { id: 4, nom: 'Palais Royal d\'Abomey', description: 'Patrimoine UNESCO', zoneIds: [4], duree: '2h', prix: 20 },
    { id: 5, nom: 'Lac Nokoué', description: 'Balade en pirogue', zoneIds: [1, 2], duree: '4h', prix: 30 },
    { id: 6, nom: 'Pendjari National Park', description: 'Safari et faune sauvage', zoneIds: [6], duree: '1 jour', prix: 50 },
    { id: 7, nom: 'Marché de Parakou', description: 'Artisanat et commerce', zoneIds: [5], duree: '2h', prix: 15 },
    { id: 8, nom: 'Temple des Pythons', description: 'Culte vaudou', zoneIds: [3], duree: '1h', prix: 10 }
  ];

  // État du formulaire
  nombreJours = 1;
  nombrePersonnes = 1;
  jours: Jour[] = [];
  expanded: boolean[] = [];
  options: OptionsGenerales = {
    hebergement: '',
    transport: '',
    guide: false,
    chauffeur: false,
    pensionComplete: false
  };

  demande: DemandeCircuit = {
    nombreJours: 1,
    nombrePersonnes: 1,
    jours: [],
    options: this.options,
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    message: ''
  };

  isSubmitting = false;
  submitSuccess = false;
  submitError = false;

  joursExpanded = false;

  constructor() {
    this.initialiserJours();
  }

  initialiserJours() {
    this.jours = [];
    for (let i = 1; i <= this.nombreJours; i++) {
      this.jours.push({
        numero: i,
        zones: [],
        activites: []
      });
    }
    this.expanded = new Array(this.nombreJours).fill(false);
    if (this.nombreJours > 0) {
      this.expanded[0] = true;
    }
  }

  changerNombreJours() {
    this.initialiserJours();
  }

  toggleJour(index: number) {
    this.expanded[index] = !this.expanded[index];
  }

  // Vérifier si deux zones sont proches
  zonesProches(zone1: Zone, zone2: Zone): boolean {
    // Logique simplifiée : même région = proche
    return zone1.region === zone2.region;
  }

  // Obtenir activités disponibles pour les zones sélectionnées
  getActivitesPourZones(zoneIds: number[]): Activite[] {
    return this.activites.filter(a => a.zoneIds.some(id => zoneIds.includes(id)));
  }

  ajouterZone(jourIndex: number, zone: Zone) {
    const jour = this.jours[jourIndex];
    if (jour.zones.length >= 2) return;

    // Vérifier proximité si deuxième zone
    if (jour.zones.length === 1 && !this.zonesProches(jour.zones[0], zone)) {
      alert('Cette zone est trop éloignée de la première sélectionnée.');
      return;
    }

    jour.zones.push(zone);
  }

  retirerZone(jourIndex: number, zoneIndex: number) {
    const jour = this.jours[jourIndex];
    jour.zones.splice(zoneIndex, 1);
    // Réinitialiser activités si zones changent
    jour.activites = jour.activites.filter(a => this.getActivitesPourZones(jour.zones.map(z => z.id)).some(act => act.id === a.id));
  }

  toggleActivite(jourIndex: number, activite: Activite) {
    const jour = this.jours[jourIndex];
    const index = jour.activites.findIndex(a => a.id === activite.id);

    if (index > -1) {
      jour.activites.splice(index, 1);
    } else {
      if (jour.activites.length >= 5) {
        alert('Maximum 5 activités par jour.');
        return;
      }
      jour.activites.push(activite);
    }
  }

  isActiviteSelected(jourIndex: number, activite: Activite): boolean {
    return this.jours[jourIndex].activites.some(a => a.id === activite.id);
  }

  getActivitesDisponibles(jourIndex: number): Activite[] {
    const jour = this.jours[jourIndex];
    if (jour.zones.length === 0) return [];
    return this.getActivitesPourZones(jour.zones.map(z => z.id));
  }

  calculerPrixTotal(): number {
    let total = 0;
    this.jours.forEach(jour => {
      jour.activites.forEach(act => total += act.prix);
    });
    return total;
  }

  getZoneNames(jour: Jour): string {
    return jour.zones.map(z => z.nom).join(', ');
  }

  getActiviteNames(jour: Jour): string {
    return jour.activites.map(a => a.nom).join(', ');
  }

  getTransportsDisponibles(): string[] {
    if (this.nombrePersonnes <= 2) return [this.transports[0]];
    if (this.nombrePersonnes <= 4) return [this.transports[0], this.transports[1]];
    if (this.nombrePersonnes <= 8) return [this.transports[1], this.transports[2]];
    return [this.transports[2], this.transports[3]];
  }

  prochaineEtape() {
    if (this.etape < 5) {
      this.etape++;
    }
  }

  etapePrecedente() {
    if (this.etape > 1) {
      this.etape--;
    }
  }

  isFormValid(): boolean {
    return !!(this.demande.nom && this.demande.prenom && this.demande.email && this.demande.telephone);
  }

  onSubmit() {
    if (!this.isFormValid()) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.demande.nombreJours = this.nombreJours;
    this.demande.nombrePersonnes = this.nombrePersonnes;
    this.demande.jours = this.jours;
    this.demande.options = this.options;

    this.isSubmitting = true;
    this.submitError = false;

    this.http.post('http://localhost:8080/api/circuits/personnalise', this.demande).subscribe({
      next: () => {
        this.submitSuccess = true;
        this.isSubmitting = false;
      },
      error: () => {
        this.submitError = true;
        this.isSubmitting = false;
      }
    });
  }

  voirHebergements() {
    alert('Page des hébergements : ' + this.hebergements.join(', '));
  }

  toggleJoursExpanded() {
    this.joursExpanded = !this.joursExpanded;
  }
}
