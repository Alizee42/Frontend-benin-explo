import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CircuitsPersonnalisesService, CircuitPersonnaliseDTO, JourDTO } from '../../../../services/circuits-personnalises.service';
import { ZonesService, Zone } from '../../../../services/zones.service';
import { ActivitesService, Activite } from '../../../../services/activites.service';
import { VillesService, VilleDTO } from '../../../../services/villes.service';
import { HebergementsService, HebergementDTO } from '../../../../services/hebergements.service';
import { TarifsCircuitPersonnaliseDTO, TarifsCircuitPersonnaliseService } from '../../../../services/tarifs-circuit-personnalise.service';

import { Jour, OptionsGenerales, HebergementState, ContactInfo } from './circuit-personnalise.types';
import { calculerPrixActivites, calculerPrixHebergement, calculerPrixTransport, calculerPrixGuide, calculerPrixChauffeur, calculerPrixPensionComplete, getPricingCurrencyLabel } from './circuit-personnalise.utils';

import { CircuitPersonnaliseStep1Component } from './steps/step1/circuit-personnalise-step1.component';
import { CircuitPersonnaliseStep2Component } from './steps/step2/circuit-personnalise-step2.component';
import { CircuitPersonnaliseStep3Component } from './steps/step3/circuit-personnalise-step3.component';
import { CircuitPersonnaliseStep4Component } from './steps/step4/circuit-personnalise-step4.component';
import { CircuitPersonnaliseStep5Component } from './steps/step5/circuit-personnalise-step5.component';

@Component({
  selector: 'app-circuit-personnalise',
  standalone: true,
  imports: [
    CommonModule,
    CircuitPersonnaliseStep1Component,
    CircuitPersonnaliseStep2Component,
    CircuitPersonnaliseStep3Component,
    CircuitPersonnaliseStep4Component,
    CircuitPersonnaliseStep5Component
  ],
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
  private tarifsCircuitPersonnaliseService = inject(TarifsCircuitPersonnaliseService);

  // Navigation
  etape = 1;

  // Catalog data
  zones: Zone[] = [];
  villes: VilleDTO[] = [];
  activites: Activite[] = [];
  hebergements: HebergementDTO[] = [];
  tarifsOptions: TarifsCircuitPersonnaliseDTO | null = null;
  catalogLoading = true;
  catalogNotices: string[] = [];

  // Form state
  nombreJours = 1;
  nombrePersonnes = 1;
  jours: Jour[] = [{ numero: 1, zoneId: null, villeId: null, activites: [] }];
  options: OptionsGenerales = { transportId: '', guide: false, chauffeur: false, pensionComplete: false };
  hebergementState: HebergementState = { mode: 'auto', hebergementId: null, dateArrivee: '', dateDepart: '' };
  contact: ContactInfo = { nom: '', prenom: '', email: '', telephone: '', message: '' };

  // Submission state
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  submitErrorMessage = '';

  constructor() {
    this.chargerDonnees();
  }

  get isDirty(): boolean {
    return this.etape > 1 || this.nombreJours !== 1 || this.nombrePersonnes !== 1;
  }

  private chargerDonnees(): void {
    const notices: string[] = [];
    this.catalogLoading = true;

    forkJoin({
      zones: this.zonesService.getAllZones().pipe(catchError(() => {
        notices.push('Les zones ne peuvent pas être chargées pour le moment.');
        return of([] as Zone[]);
      })),
      activites: this.activitesService.getAllActivites().pipe(catchError(() => {
        notices.push('Les activités ne peuvent pas être chargées pour le moment.');
        return of([] as Activite[]);
      })),
      villes: this.villesService.getAll().pipe(catchError(() => {
        notices.push('Les villes ne peuvent pas être chargées pour le moment.');
        return of([] as VilleDTO[]);
      })),
      hebergements: this.hebergementsService.getAll().pipe(catchError(() => {
        notices.push('Les hébergements ne peuvent pas être chargés pour le moment.');
        return of([] as HebergementDTO[]);
      })),
      tarifs: this.tarifsCircuitPersonnaliseService.getCurrent().pipe(catchError(() => {
        notices.push('Les tarifs seront confirmés par notre équipe.');
        return of(null as TarifsCircuitPersonnaliseDTO | null);
      }))
    }).subscribe(({ zones, activites, villes, hebergements, tarifs }) => {
      this.zones = zones ?? [];
      this.activites = activites ?? [];
      this.villes = villes ?? [];
      this.hebergements = hebergements ?? [];
      this.tarifsOptions = tarifs;
      this.catalogLoading = false;
      this.catalogNotices = notices;
    });
  }

  // Step 1 handlers
  onNombreJoursChange(n: number): void {
    this.nombreJours = n;
    this.jours = Array.from({ length: n }, (_, i) => {
      const existing = this.jours[i];
      return existing ?? { numero: i + 1, zoneId: null, villeId: null, activites: [] };
    });
  }

  onNombrePersonnesChange(n: number): void {
    this.nombrePersonnes = n;
    // Reset transport if no longer compatible
    if (this.options.transportId) {
      const disponibles = this.getTransportIdsDisponibles(n);
      if (!disponibles.includes(this.options.transportId)) {
        this.options = { ...this.options, transportId: '' };
      }
    }
  }

  // Step 2 handlers
  onJoursChange(jours: Jour[]): void {
    this.jours = jours;
  }

  // Step 3 handlers
  onOptionsChange(options: OptionsGenerales): void {
    this.options = options;
  }

  onHebergementStateChange(state: HebergementState): void {
    this.hebergementState = state;
  }

  // Step 5 handlers
  onContactChange(contact: ContactInfo): void {
    this.contact = contact;
  }

  onSubmit(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = false;
    this.submitErrorMessage = '';

    const selectedHebergement = this.hebergements.find(h => h.id === this.hebergementState.hebergementId);
    const devise = getPricingCurrencyLabel(this.tarifsOptions);

    const joursDTO: JourDTO[] = this.jours.map(jour => ({
      numeroJour: jour.numero,
      zoneId: jour.zoneId ?? undefined,
      villeId: jour.villeId ?? undefined,
      activiteIds: jour.activites,
      descriptionJour: ''
    }));

    const payload: CircuitPersonnaliseDTO = {
      nomClient: this.contact.nom.trim(),
      prenomClient: this.contact.prenom.trim(),
      emailClient: this.contact.email.trim(),
      telephoneClient: this.contact.telephone.trim(),
      messageClient: this.contact.message.trim() || undefined,
      nombreJours: this.nombreJours,
      nombrePersonnes: this.nombrePersonnes,
      dateVoyageSouhaitee: this.hebergementState.dateArrivee || undefined,
      avecHebergement: this.hebergementState.mode === 'auto' || !!selectedHebergement,
      typeHebergement: this.hebergementState.mode === 'auto' ? 'À proposer' : (selectedHebergement?.nom ?? undefined),
      hebergementId: selectedHebergement?.id,
      dateArriveeHebergement: selectedHebergement ? this.hebergementState.dateArrivee : undefined,
      dateDepartHebergement: selectedHebergement ? this.hebergementState.dateDepart : undefined,
      avecTransport: !!this.options.transportId,
      typeTransport: this.options.transportId || undefined,
      avecGuide: this.options.guide,
      avecChauffeur: this.options.chauffeur,
      pensionComplete: this.options.pensionComplete,
      prixActivitesEstime: calculerPrixActivites(this.jours, this.activites) || undefined,
      prixHebergementEstime: calculerPrixHebergement(selectedHebergement, this.hebergementState.dateArrivee, this.hebergementState.dateDepart) || undefined,
      prixTransportEstime: calculerPrixTransport(this.tarifsOptions, this.options.transportId, this.nombreJours) || undefined,
      prixGuideEstime: calculerPrixGuide(this.tarifsOptions, this.options, this.nombreJours) || undefined,
      prixChauffeurEstime: calculerPrixChauffeur(this.tarifsOptions, this.options, this.nombreJours) || undefined,
      prixPensionCompleteEstime: calculerPrixPensionComplete(this.tarifsOptions, this.options, this.nombreJours, this.nombrePersonnes) || undefined,
      devisePrixEstime: devise,
      jours: joursDTO
    };

    payload.prixEstime = (payload.prixActivitesEstime ?? 0)
      + (payload.prixHebergementEstime ?? 0)
      + (payload.prixTransportEstime ?? 0)
      + (payload.prixGuideEstime ?? 0)
      + (payload.prixChauffeurEstime ?? 0)
      + (payload.prixPensionCompleteEstime ?? 0) || undefined;

    this.circuitsPersonnalisesService.createDemande(payload).subscribe({
      next: () => {
        this.submitSuccess = true;
        this.isSubmitting = false;
      },
      error: (error) => {
        this.submitError = true;
        this.isSubmitting = false;
        this.submitErrorMessage = this.extractErrorMessage(error);
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  private getTransportIdsDisponibles(n: number): string[] {
    if (n <= 2) return ['compact'];
    if (n <= 4) return ['compact', 'familial'];
    if (n <= 8) return ['familial', 'minibus'];
    return ['minibus', 'bus'];
  }

  private extractErrorMessage(error: unknown): string {
    const e = error as Record<string, unknown>;
    if (typeof e?.['error'] === 'string' && (e['error'] as string).trim()) return (e['error'] as string).trim();
    if (typeof (e?.['error'] as Record<string, unknown>)?.['message'] === 'string') return ((e['error'] as Record<string, unknown>)['message'] as string).trim();
    if (typeof e?.['message'] === 'string' && (e['message'] as string).trim()) return (e['message'] as string).trim();
    return 'Une erreur s\'est produite lors de l\'envoi. Veuillez réessayer.';
  }
}
