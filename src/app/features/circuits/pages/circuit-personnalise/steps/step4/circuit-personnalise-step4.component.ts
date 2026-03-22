import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Jour, OptionsGenerales, HebergementState } from '../../circuit-personnalise.types';
import { HebergementDTO } from '../../../../../../services/hebergements.service';
import { Activite } from '../../../../../../services/activites.service';
import { TarifsCircuitPersonnaliseDTO } from '../../../../../../services/tarifs-circuit-personnalise.service';
import {
  getPricingCurrencyLabel, getTransportLabel,
  calculerPrixActivites, calculerPrixHebergement, calculerPrixTransport,
  calculerPrixGuide, calculerPrixChauffeur, calculerPrixPensionComplete,
  getNombreNuits, formatDateLabel
} from '../../circuit-personnalise.utils';

@Component({
  standalone: true,
  selector: 'app-circuit-step4',
  imports: [CommonModule],
  templateUrl: './circuit-personnalise-step4.component.html',
  styleUrl: '../../circuit-personnalise-steps.scss'
})
export class CircuitPersonnaliseStep4Component {
  @Input() jours: Jour[] = [];
  @Input() activites: Activite[] = [];
  @Input() hebergements: HebergementDTO[] = [];
  @Input() options: OptionsGenerales = { transportId: '', guide: false, chauffeur: false, pensionComplete: false };
  @Input() hebergementState: HebergementState = { mode: 'auto', hebergementId: null, dateArrivee: '', dateDepart: '' };
  @Input() tarifsOptions: TarifsCircuitPersonnaliseDTO | null = null;
  @Input() nombreJours = 1;
  @Input() nombrePersonnes = 1;

  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  getActiviteById(id: number): Activite | undefined {
    return this.activites.find(a => a.id === id);
  }

  getActiviteNamesForJour(jour: Jour): string {
    return jour.activites
      .map(id => this.activites.find(a => a.id === id)?.nom)
      .filter((n): n is string => !!n)
      .join(', ') || 'Aucune activité';
  }

  getSelectedHebergement(): HebergementDTO | undefined {
    return this.hebergements.find(h => h.id === this.hebergementState.hebergementId);
  }

  getPricingLabel(): string {
    return getPricingCurrencyLabel(this.tarifsOptions);
  }

  getTransportLabel(id: string): string {
    return getTransportLabel(id) || 'À définir';
  }

  getNombreNuits(): number {
    return getNombreNuits(this.hebergementState.dateArrivee, this.hebergementState.dateDepart);
  }

  getDateRangeLabel(): string {
    const nuits = this.getNombreNuits();
    if (!this.hebergementState.dateArrivee || !this.hebergementState.dateDepart || nuits <= 0) {
      return 'Dates à définir';
    }
    return `${formatDateLabel(this.hebergementState.dateArrivee)} → ${formatDateLabel(this.hebergementState.dateDepart)} (${nuits} nuit${nuits > 1 ? 's' : ''})`;
  }

  prixActivites(): number {
    return calculerPrixActivites(this.jours, this.activites);
  }

  prixHebergement(): number {
    return calculerPrixHebergement(
      this.getSelectedHebergement(),
      this.hebergementState.dateArrivee,
      this.hebergementState.dateDepart
    );
  }

  prixTransport(): number {
    return calculerPrixTransport(this.tarifsOptions, this.options.transportId, this.nombreJours);
  }

  prixGuide(): number {
    return calculerPrixGuide(this.tarifsOptions, this.options, this.nombreJours);
  }

  prixChauffeur(): number {
    return calculerPrixChauffeur(this.tarifsOptions, this.options, this.nombreJours);
  }

  prixPension(): number {
    return calculerPrixPensionComplete(this.tarifsOptions, this.options, this.nombreJours, this.nombrePersonnes);
  }

  prixTotal(): number {
    return this.prixActivites() + this.prixHebergement() + this.prixTransport()
      + this.prixGuide() + this.prixChauffeur() + this.prixPension();
  }

  hasPricedItems(): boolean {
    return this.prixTotal() > 0;
  }
}
