import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EUR_TO_XOF_RATE } from '../../../../shared/constants/currency.constants';
import {
  CircuitPersonnaliseDTO,
  CircuitsPersonnalisesService
} from '../../../../services/circuits-personnalises.service';

@Component({
  selector: 'app-circuit-personnalise-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './circuit-personnalise-detail.component.html',
  styleUrls: ['./circuit-personnalise-detail.component.scss']
})
export class CircuitPersonnaliseDetailComponent implements OnInit {
  demande: CircuitPersonnaliseDTO | null = null;
  isLoading = true;
  demandeId: string | null = null;
  selectedDayIndex = 0;

  showDecisionModal = false;
  decisionType: 'approve' | 'reject' | null = null;
  refusalReason = '';
  emailSubject = '';
  emailBody = '';
  isSubmittingDecision = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private circuitsPersonnalisesService: CircuitsPersonnalisesService
  ) {}

  ngOnInit(): void {
    this.demandeId = this.route.snapshot.paramMap.get('id');
    if (this.demandeId) {
      this.loadDemande();
    }
  }

  loadDemande(): void {
    if (!this.demandeId) return;

    this.isLoading = true;
    this.circuitsPersonnalisesService.getDemandeById(+this.demandeId).subscribe({
      next: (demande: CircuitPersonnaliseDTO) => {
        this.demande = demande;
        this.selectedDayIndex = 0;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement demande', error);
        this.isLoading = false;
        this.router.navigate(['/admin/circuits-personnalises']);
      }
    });
  }

  openDecisionModal(type: 'approve' | 'reject'): void {
    if (!this.demande) return;
    this.decisionType = type;
    this.refusalReason = '';
    this.emailSubject = type === 'approve'
      ? 'Votre demande de circuit personnalise a ete approuvee'
      : 'Votre demande de circuit personnalise';
    this.emailBody = this.buildDecisionEmailBody(type);
    this.showDecisionModal = true;
  }

  closeDecisionModal(): void {
    this.showDecisionModal = false;
    this.decisionType = null;
    this.refusalReason = '';
    this.emailSubject = '';
    this.emailBody = '';
    this.isSubmittingDecision = false;
  }

  private buildDecisionEmailBody(type: 'approve' | 'reject'): string {
    if (!this.demande) return '';
    const statusLine = type === 'approve'
      ? 'Votre demande de circuit personnalise a ete approuvee.'
      : 'Votre demande de circuit personnalise ne peut pas etre validee pour le moment.';
    const reasonLine = type === 'reject' ? '\nMotif: {motif}' : '';

    return `Bonjour ${this.demande.prenomClient} ${this.demande.nomClient},\n\n${statusLine}${reasonLine}\n\nDetails:\n- Nombre de personnes: ${this.demande.nombrePersonnes}\n- Nombre de jours: ${this.demande.nombreJours}\n- Hebergement: ${this.getHebergementSummary(this.demande)}\n- Prix estime: ${this.demande.prixEstime ? this.formatPrix(this.demande.prixEstime, this.demande.devisePrixEstime) : 'A determiner'}\n\nL'equipe Benin Explo`;
  }

  submitDecision(): void {
    if (!this.demande || !this.decisionType || this.isSubmittingDecision) return;
    if (this.decisionType === 'reject' && !this.refusalReason.trim()) return;

    const status = this.decisionType === 'approve' ? 'ACCEPTE' : 'REFUSE';
    this.isSubmittingDecision = true;

    const commentaireAdmin = this.decisionType === 'approve'
      ? 'Demande validee par un administrateur.'
      : 'Demande refusee par un administrateur.';

    const finalEmailBody = this.decisionType === 'reject'
      ? this.emailBody.replace(/\{motif\}/g, this.refusalReason.trim())
      : this.emailBody;

    this.circuitsPersonnalisesService.updateStatut(
      this.demande.id!,
      status,
      undefined,
      commentaireAdmin,
      this.decisionType === 'reject' ? this.refusalReason.trim() : undefined,
      this.emailSubject,
      finalEmailBody
    ).subscribe({
      next: (demande: CircuitPersonnaliseDTO) => {
        this.demande = demande;
        this.closeDecisionModal();
      },
      error: (error: any) => {
        console.error('Erreur mise a jour du statut', error);
        this.isSubmittingDecision = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/circuits-personnalises']);
  }

  getStatusBadgeClass(statut: string): string {
    switch (statut) {
      case 'ACCEPTE':
      case 'Valide':
        return 'status-approved';
      case 'REFUSE':
        return 'status-rejected';
      case 'EN_ATTENTE':
        return 'status-pending';
      case 'EN_TRAITEMENT':
        return 'status-processing';
      case 'TERMINE':
        return 'status-completed';
      default:
        return 'status-default';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut) {
      case 'ACCEPTE':
        return 'Acceptee';
      case 'REFUSE':
        return 'Refusee';
      case 'EN_TRAITEMENT':
        return 'En traitement';
      case 'TERMINE':
        return 'Terminee';
      case 'EN_ATTENTE':
        return 'En attente';
      default:
        return statut;
    }
  }

  formatDate(date: string): string {
    const hasTime = date.includes('T');
    return new Date(date).toLocaleDateString('fr-FR', hasTime
      ? {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }
      : {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
  }

  formatPrix(prix?: number, devise?: string): string {
    if (prix === undefined || prix === null || Number.isNaN(prix)) return 'Non estime';
    const currency = (devise || 'EUR').toUpperCase();
    if (currency === 'EUR') {
      const eur = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(prix);

      const xof = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF'
      }).format(prix * EUR_TO_XOF_RATE);

      return `${eur} / ${xof}`;
    }

    const xof = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(prix);

    const eurValue = prix / EUR_TO_XOF_RATE;
    const eur = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(eurValue);

    return `${eur} / ${xof}`;
  }

  getHebergementSummary(demande: CircuitPersonnaliseDTO): string {
    if (!demande.avecHebergement) {
      return 'Sans hebergement';
    }

    if (demande.hebergementNom) {
      const dates = demande.dateArriveeHebergement && demande.dateDepartHebergement
        ? ` du ${this.formatDate(demande.dateArriveeHebergement)} au ${this.formatDate(demande.dateDepartHebergement)}`
        : '';
      return `${demande.hebergementNom}${dates}`;
    }

    return demande.typeHebergement || 'A proposer';
  }

  selectDay(index: number): void {
    this.selectedDayIndex = index;
  }

  get selectedDay() {
    if (!this.demande?.jours?.length) return null;
    const safeIndex = Math.min(this.selectedDayIndex, this.demande.jours.length - 1);
    return this.demande.jours[safeIndex];
  }
}
