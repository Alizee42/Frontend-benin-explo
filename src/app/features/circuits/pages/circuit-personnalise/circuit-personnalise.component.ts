import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CircuitsPersonnalisesService, DemandeCircuitPersonnalise } from '../../../../services/circuits-personnalises.service';
import { ZonesService, Zone as ApiZone } from '../../../../services/zones.service';
import { ActivitesService, Activite as ApiActivite } from '../../../../services/activites.service';
import { VillesService, VilleDTO } from '../../../../services/villes.service';
import { HebergementsService, HebergementDTO } from '../../../../services/hebergements.service';

interface Zone extends ApiZone {}

interface Activite extends ApiActivite {}

interface Jour {
  numero: number;
  zoneId: number | null;
  villeId: number | null;
  activites: number[];
  villes?: VilleDTO[]; // ajouter pour stocker les villes filtrées
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
  private router = inject(Router);
  private circuitsPersonnalisesService = inject(CircuitsPersonnalisesService);
  private zonesService = inject(ZonesService);
  private activitesService = inject(ActivitesService);
  private villesService = inject(VillesService);
  private hebergementsService = inject(HebergementsService);

  // Durée maximale d'activités autorisée par jour (en minutes)
  private readonly DAILY_MINUTES_LIMIT = 12 * 60; // 12 heures d'activités par jour

  // Étapes du formulaire
  etape = 1; // 1: durée, 2: jours, 3: options, 4: résumé, 5: formulaire

  // Données chargées depuis le backend
  zones: Zone[] = [];
  villes: VilleDTO[] = [];
  hebergements: HebergementDTO[] = [];

  transports: string[] = [
    'Voiture compacte (1-2 personnes)',
    'Voiture familiale (3-4 personnes)',
    'Minibus (5-8 personnes)',
    'Bus touristique (9+ personnes)'
  ];

  activites: Activite[] = [];

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

  // Image modal state
  imageModalOpen = false;
  imageModalUrl: string | null = null;

  constructor() {
    this.initialiserJours();
    this.chargerDonnees();
  }

  private chargerDonnees() {
    this.zonesService.getAllZones().subscribe({
      next: zones => {
        this.zones = zones;
      },
      error: err => {
        console.error('Erreur chargement zones pour circuit personnalisé', err);
      }
    });

    this.activitesService.getAllActivites().subscribe({
      next: activites => {
        this.activites = activites;
      },
      error: err => {
        console.error('Erreur chargement activités pour circuit personnalisé', err);
      }
    });

    this.villesService.getAll().subscribe({
      next: villes => {
        this.villes = villes;
        // Mettre à jour les villes des jours existants
        this.jours.forEach(j => j.villes = this.getVillesForZone(j.zoneId));
      },
      error: err => {
        console.error('Erreur chargement villes pour circuit personnalisé', err);
      }
    });

    this.hebergementsService.getAll().subscribe({
      next: hebergements => {
        this.hebergements = hebergements;
      },
      error: err => {
        console.error('Erreur chargement hébergements pour circuit personnalisé', err);
      }
    });
  }

  initialiserJours() {
    this.jours = [];
    for (let i = 1; i <= this.nombreJours; i++) {
      this.jours.push({
        numero: i,
        zoneId: null,
        villeId: null,
        activites: [],
        villes: this.villes // toutes au début
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

  onZoneChange(jour: Jour, zoneId: number | null) {
    jour.zoneId = zoneId;
    jour.villeId = null;
    jour.activites = [];
    jour.villes = this.getVillesForZone(zoneId);
  }

  getVillesForZone(zoneId: number | null): VilleDTO[] {
    if (!zoneId) return this.villes;
    const filtered = this.villes.filter(v => v.zoneId == zoneId);
    return filtered;
  }

  getVilleNamesForZone(zoneId: number): string {
    return this.getVillesForZone(zoneId).map(v => v.nom).join(', ');
  }

  private getActiviteDurationMinutes(activite: Activite): number {
    const minutes = (activite as any).dureeMinutes != null
      ? Number((activite as any).dureeMinutes)
      : (activite.duree != null ? Math.round(Number(activite.duree) * 60) : 0);
    return isNaN(minutes) ? 0 : minutes;
  }

  toggleActivite(jourIndex: number, activite: Activite) {
    const jour = this.jours[jourIndex];
    const index = jour.activites.indexOf(activite.id);

    if (index > -1) {
      jour.activites.splice(index, 1);
    } else {
      if (jour.activites.length >= 5) {
        alert('Maximum 5 activités par jour.');
        return;
      }

      // Vérifier que la somme des durées ne dépasse pas la limite quotidienne
      const currentTotal = jour.activites.reduce((sum, id) => {
        const act = this.activites.find(a => a.id === id);
        return sum + (act ? this.getActiviteDurationMinutes(act) : 0);
      }, 0);

      const newTotal = currentTotal + this.getActiviteDurationMinutes(activite);

      if (newTotal > this.DAILY_MINUTES_LIMIT) {
        const heuresMax = this.DAILY_MINUTES_LIMIT / 60;
        alert(`Vous dépassez la durée maximale de ${heuresMax}h d'activités pour une journée.`);
        return;
      }

      jour.activites.push(activite.id);
    }
  }

  isActiviteSelected(jourIndex: number, activite: Activite): boolean {
    return this.jours[jourIndex].activites.includes(activite.id);
  }

  getActivitesDisponibles(jourIndex: number): Activite[] {
    const jour = this.jours[jourIndex];

    // Si aucune zone / ville n'est choisie, on propose tout
    if (!jour.zoneId && !jour.villeId) {
      return this.activites;
    }

    let disponibles = this.activites;

    // 1) Filtre par zone si sélectionnée
    if (jour.zoneId) {
      disponibles = disponibles.filter(a => a.zoneId === jour.zoneId);
    }

    // 2) Filtre par ville si sélectionnée (en utilisant le nom de la ville)
    if (jour.villeId) {
      const ville = this.villes.find(v => v.id === jour.villeId);
      if (ville) {
        const villeNom = ville.nom.toLowerCase().trim();
        disponibles = disponibles.filter(a =>
          a.ville != null && a.ville.toLowerCase().trim() === villeNom
        );
      }
    }

    return disponibles;
  }

  calculerPrixTotal(): number {
    let total = 0;
    this.jours.forEach(jour => {
      jour.activites.forEach(id => {
        const act = this.activites.find(a => a.id === id);
        if (act && act.prix != null) {
          total += act.prix;
        }
      });
    });
    return total;
  }

  getZoneNames(jour: Jour): string {
    if (!jour.zoneId) return '';
    const z = this.zones.find(z => z.idZone === jour.zoneId);
    return z ? z.nom : '';
  }

  getActiviteNames(jour: Jour): string {
    return jour.activites
      .map(id => this.activites.find(a => a.id === id)?.nom)
      .filter((n): n is string => !!n)
      .join(', ');
  }

  getActiviteById(id: number): Activite | undefined {
    return this.activites.find(a => a.id === id);
  }

  onVilleChange(jour: Jour, villeId: number | null) {
    jour.villeId = villeId;
    jour.activites = [];
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

    const payload: Omit<DemandeCircuitPersonnalise, 'id' | 'dateCreation' | 'statut'> = {
      client: {
        nom: `${this.demande.prenom} ${this.demande.nom}`.trim(),
        email: this.demande.email,
        telephone: this.demande.telephone
      },
      nombrePersonnes: this.demande.nombrePersonnes,
      nombreJours: this.demande.nombreJours,
      zones: this.jours
        .map(j => j.zoneId)
        .filter((id): id is number => id != null)
        .map(id => this.zones.find(z => z.idZone === id)?.nom || '')
        .filter(n => !!n),
      activites: this.jours
        .flatMap(j => j.activites)
        .map(id => this.activites.find(a => a.id === id)?.nom || '')
        .filter(n => !!n),
      avecHebergement: !!this.options.hebergement,
      avecTransport: !!this.options.transport,
      extras: this.buildExtrasFromOptionsAndMessage(),
      prixEstime: this.calculerPrixTotal()
    };

    this.circuitsPersonnalisesService.createDemande(payload).subscribe({
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
    this.router.navigate(['/hebergements']);
  }

  toggleJoursExpanded() {
    this.joursExpanded = !this.joursExpanded;
  }

  private buildExtrasFromOptionsAndMessage(): string[] {
    const extras: string[] = [];

    if (this.options.guide) {
      extras.push('Guide touristique');
    }
    if (this.options.chauffeur) {
      extras.push('Chauffeur privé');
    }
    if (this.options.pensionComplete) {
      extras.push('Pension complète');
    }
    if (this.options.hebergement) {
      extras.push(`Hébergement: ${this.options.hebergement}`);
    }
    if (this.options.transport) {
      extras.push(`Transport: ${this.options.transport}`);
    }
    if (this.demande.message) {
      extras.push(`Message client: ${this.demande.message}`);
    }

    return extras.length ? extras : undefined as any;
  }

  openImageModal(url: string | null, event: Event) {
    event.stopPropagation(); // Prevent selecting the activity
    if (!url) return;
    const trimmed = url.trim();
    this.imageModalUrl = (trimmed.startsWith('http') || trimmed.startsWith('data:'))
      ? trimmed
      : (trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
    this.imageModalOpen = true;
  }

  closeImageModal() {
    this.imageModalOpen = false;
    this.imageModalUrl = null;
  }

  trackByVille(index: number, ville: VilleDTO): number {
    return ville.id;
  }

  trackByZone(index: number, zone: Zone): number {
    return zone.idZone;
  }
}
