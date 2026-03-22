import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  OptionsGenerales, HebergementState,
  TRANSPORT_OPTIONS, TransportOption
} from '../../circuit-personnalise.types';
import { TarifsCircuitPersonnaliseDTO } from '../../../../../../services/tarifs-circuit-personnalise.service';
import { HebergementDTO } from '../../../../../../services/hebergements.service';
import { ReservationHebergementService } from '../../../../../../services/reservation-hebergement.service';
import {
  getTarifValue, getTransportDailyRate, getPricingCurrencyLabel, getTransportLabel,
  getNombreNuits, toIsoDate, formatDateLabel, parseDate
} from '../../circuit-personnalise.utils';

@Component({
  standalone: true,
  selector: 'app-circuit-step3',
  imports: [CommonModule, FormsModule],
  templateUrl: './circuit-personnalise-step3.component.html',
  styleUrl: '../../circuit-personnalise-steps.scss'
})
export class CircuitPersonnaliseStep3Component implements OnInit {
  @Input() hebergements: HebergementDTO[] = [];
  @Input() tarifsOptions: TarifsCircuitPersonnaliseDTO | null = null;
  @Input() nombrePersonnes = 1;
  @Input() nombreJours = 1;
  @Input() initialOptions: OptionsGenerales = { transportId: '', guide: false, chauffeur: false, pensionComplete: false };
  @Input() initialHebergementState: HebergementState = { mode: 'auto', hebergementId: null, dateArrivee: '', dateDepart: '' };

  @Output() optionsChange = new EventEmitter<OptionsGenerales>();
  @Output() hebergementStateChange = new EventEmitter<HebergementState>();
  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  private reservationService = inject(ReservationHebergementService);
  private router = inject(Router);

  options: OptionsGenerales = { transportId: '', guide: false, chauffeur: false, pensionComplete: false };
  hebergementMode: 'auto' | 'choisir' = 'auto';
  selectedHebergementId: number | null = null;
  hebergementDateArrivee = '';
  hebergementDateDepart = '';
  isCheckingAvailability = false;
  hebergementAvailability: boolean | null = null;
  hebergementAvailabilityMessage = '';
  stepError = '';

  private availabilityRequestId = 0;

  ngOnInit(): void {
    this.options = { ...this.initialOptions };
    this.hebergementMode = this.initialHebergementState.mode;
    this.selectedHebergementId = this.initialHebergementState.hebergementId;
    this.hebergementDateArrivee = this.initialHebergementState.dateArrivee;
    this.hebergementDateDepart = this.initialHebergementState.dateDepart;

    if (this.hebergementMode === 'choisir' && this.selectedHebergementId) {
      this.checkAvailability();
    }
  }

  /** Called by parent via @ViewChild before navigating forward. */
  validate(): boolean {
    this.stepError = '';
    if (this.hebergementMode !== 'choisir') return true;

    if (!this.selectedHebergementId) {
      this.stepError = 'Sélectionnez un hébergement ou laissez notre équipe vous proposer une option.';
      return false;
    }
    if (!this.hebergementDateArrivee || !this.hebergementDateDepart) {
      this.stepError = 'Choisissez la date d\'arrivée et la date de départ pour cet hébergement.';
      return false;
    }
    if (this.getNombreNuits() <= 0) {
      this.stepError = 'La date de départ doit être après la date d\'arrivée.';
      return false;
    }
    if (this.isCheckingAvailability) {
      this.stepError = 'Vérification de la disponibilité en cours, veuillez patienter.';
      return false;
    }
    if (this.hebergementAvailability === false) {
      this.stepError = this.hebergementAvailabilityMessage || 'Cet hébergement n\'est pas disponible pour ces dates.';
      return false;
    }
    if (this.hebergementAvailability == null) {
      this.stepError = 'Veuillez vérifier la disponibilité de l\'hébergement avant de continuer.';
      return false;
    }
    return true;
  }

  setHebergementMode(mode: 'auto' | 'choisir'): void {
    this.hebergementMode = mode;
    this.stepError = '';
    if (mode === 'auto') {
      this.selectedHebergementId = null;
      this.hebergementDateArrivee = '';
      this.hebergementDateDepart = '';
      this.resetAvailability('Votre hébergement sera défini avec notre équipe.');
    } else {
      this.resetAvailability('Sélectionnez un hébergement et vos dates.');
    }
    this.emitHebergementState();
  }

  onHebergementChange(id: number | null): void {
    this.selectedHebergementId = id;
    this.stepError = '';
    this.emitHebergementState();
    this.checkAvailability();
  }

  onDatesChange(): void {
    this.stepError = '';
    this.emitHebergementState();
    this.checkAvailability();
  }

  onOptionsChange(): void {
    this.optionsChange.emit({ ...this.options });
  }

  getTransportsDisponibles(): TransportOption[] {
    const n = this.nombrePersonnes;
    const all = TRANSPORT_OPTIONS;
    if (n <= 2) return all.filter(t => t.id === 'compact');
    if (n <= 4) return all.filter(t => ['compact', 'familial'].includes(t.id));
    if (n <= 8) return all.filter(t => ['familial', 'minibus'].includes(t.id));
    return all.filter(t => ['minibus', 'bus'].includes(t.id));
  }

  getTransportRateLabel(transportId: string): string {
    if (!this.tarifsOptions) return 'Tarif à confirmer';
    const rate = getTransportDailyRate(this.tarifsOptions, transportId);
    return `${rate.toFixed(2)} ${this.getPricingLabel()}/jour`;
  }

  getGuideRateLabel(): string {
    if (!this.tarifsOptions) return 'Tarif à confirmer';
    return `${getTarifValue(this.tarifsOptions.guideParJour).toFixed(2)} ${this.getPricingLabel()}/jour`;
  }

  getChauffeurRateLabel(): string {
    if (!this.tarifsOptions) return 'Tarif à confirmer';
    return `${getTarifValue(this.tarifsOptions.chauffeurParJour).toFixed(2)} ${this.getPricingLabel()}/jour`;
  }

  getPensionRateLabel(): string {
    if (!this.tarifsOptions) return 'Tarif à confirmer';
    return `${getTarifValue(this.tarifsOptions.pensionCompleteParPersonneParJour).toFixed(2)} ${this.getPricingLabel()}/pers./jour`;
  }

  getSelectedHebergement(): HebergementDTO | undefined {
    return this.hebergements.find(h => h.id === this.selectedHebergementId);
  }

  getNombreNuits(): number {
    return getNombreNuits(this.hebergementDateArrivee, this.hebergementDateDepart);
  }

  getDateRangeLabel(): string {
    if (!this.hebergementDateArrivee || !this.hebergementDateDepart || this.getNombreNuits() <= 0) {
      return 'Dates à définir';
    }
    const nuits = this.getNombreNuits();
    return `${formatDateLabel(this.hebergementDateArrivee)} → ${formatDateLabel(this.hebergementDateDepart)} (${nuits} nuit${nuits > 1 ? 's' : ''})`;
  }

  getMinDateArrivee(): string {
    return toIsoDate(new Date());
  }

  getMinDateDepart(): string {
    if (!this.hebergementDateArrivee) return this.getMinDateArrivee();
    const d = parseDate(this.hebergementDateArrivee);
    if (!d) return this.getMinDateArrivee();
    d.setDate(d.getDate() + 1);
    return toIsoDate(d);
  }

  calculerPrixHebergement(): number {
    const h = this.getSelectedHebergement();
    if (!h) return 0;
    const nuits = this.getNombreNuits();
    return nuits > 0 ? h.prixParNuit * nuits : 0;
  }

  calculerPrixTransport(): number {
    if (!this.options.transportId) return 0;
    return getTransportDailyRate(this.tarifsOptions, this.options.transportId) * Math.max(this.nombreJours, 0);
  }

  calculerPrixGuide(): number {
    if (!this.options.guide) return 0;
    return getTarifValue(this.tarifsOptions?.guideParJour) * Math.max(this.nombreJours, 0);
  }

  calculerPrixChauffeur(): number {
    if (!this.options.chauffeur) return 0;
    return getTarifValue(this.tarifsOptions?.chauffeurParJour) * Math.max(this.nombreJours, 0);
  }

  calculerPrixPension(): number {
    if (!this.options.pensionComplete) return 0;
    return getTarifValue(this.tarifsOptions?.pensionCompleteParPersonneParJour)
      * Math.max(this.nombreJours, 0)
      * Math.max(this.nombrePersonnes, 0);
  }

  getPricingLabel(): string {
    return getPricingCurrencyLabel(this.tarifsOptions);
  }

  getTransportLabel(id: string): string {
    return getTransportLabel(id) || 'À définir';
  }

  getHebergementDisplayValue(): string {
    if (this.hebergementMode === 'auto') return 'À proposer';
    return this.getSelectedHebergement()?.nom || 'Sans hébergement';
  }

  getServicesLabel(): string {
    const s: string[] = [];
    if (this.options.guide) s.push('Guide');
    if (this.options.chauffeur) s.push('Chauffeur');
    if (this.options.pensionComplete) s.push('Pension complète');
    return s.join(' - ') || 'Aucun';
  }

  voirHebergements(): void {
    this.router.navigate(['/hebergements']);
  }

  private checkAvailability(): void {
    if (this.hebergementMode !== 'choisir' || !this.selectedHebergementId ||
        !this.hebergementDateArrivee || !this.hebergementDateDepart) {
      this.resetAvailability(this.selectedHebergementId
        ? 'Choisissez vos dates de séjour pour vérifier la disponibilité.'
        : 'Sélectionnez un hébergement pour estimer votre séjour.');
      return;
    }
    if (this.getNombreNuits() <= 0) {
      this.hebergementAvailability = false;
      this.hebergementAvailabilityMessage = 'La date de départ doit être après la date d\'arrivée.';
      return;
    }

    const reqId = ++this.availabilityRequestId;
    this.isCheckingAvailability = true;
    this.hebergementAvailability = null;
    this.hebergementAvailabilityMessage = 'Vérification de la disponibilité...';

    this.reservationService.checkDisponibilite(
      this.selectedHebergementId,
      this.hebergementDateArrivee,
      this.hebergementDateDepart
    ).subscribe({
      next: (available) => {
        if (reqId !== this.availabilityRequestId) return;
        this.isCheckingAvailability = false;
        this.hebergementAvailability = available;
        this.hebergementAvailabilityMessage = available
          ? 'Hébergement disponible pour ces dates.'
          : 'Cet hébergement n\'est pas disponible pour ces dates.';
      },
      error: () => {
        if (reqId !== this.availabilityRequestId) return;
        this.isCheckingAvailability = false;
        this.hebergementAvailability = null;
        this.hebergementAvailabilityMessage = 'Impossible de vérifier la disponibilité pour le moment.';
      }
    });
  }

  private resetAvailability(message: string): void {
    this.availabilityRequestId++;
    this.isCheckingAvailability = false;
    this.hebergementAvailability = null;
    this.hebergementAvailabilityMessage = message;
  }

  private emitHebergementState(): void {
    this.hebergementStateChange.emit({
      mode: this.hebergementMode,
      hebergementId: this.selectedHebergementId,
      dateArrivee: this.hebergementDateArrivee,
      dateDepart: this.hebergementDateDepart
    });
  }
}
