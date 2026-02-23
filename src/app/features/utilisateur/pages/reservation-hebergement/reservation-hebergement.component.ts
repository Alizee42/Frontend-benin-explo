import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationHebergementService } from '../../../../services/reservation-hebergement.service';
import { HebergementsService, HebergementDTO } from '../../../../services/hebergements.service';
import { ReservationHebergementDTO } from '../../../../models/reservation-hebergement.dto';

@Component({
  selector: 'app-reservation-hebergement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-hebergement.component.html',
  styleUrls: ['./reservation-hebergement.component.v2.scss']
})
export class ReservationHebergementComponent implements OnInit {
  hebergement: HebergementDTO | null = null;
  currentImageIndex = 0;
  currentStep = 1;
  totalSteps = 3;

  reservation: ReservationHebergementDTO = {
    hebergementId: 0,
    nomClient: '',
    prenomClient: '',
    emailClient: '',
    telephoneClient: '',
    dateArrivee: '',
    dateDepart: '',
    nombrePersonnes: 1,
    commentaires: ''
  };

  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  confirmationModalOpen = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private reservationService: ReservationHebergementService,
    private hebergementService: HebergementsService
  ) {}

  ngOnInit(): void {
    const hebergementId = Number(this.route.snapshot.params['id']);
    if (Number.isFinite(hebergementId) && hebergementId > 0) {
      this.loadHebergement(hebergementId);
      this.reservation.hebergementId = hebergementId;
    } else {
      this.errorMessage = 'Hebergement invalide.';
    }
  }

  loadHebergement(id: number): void {
    this.isLoading = true;
    this.hebergementService.getById(id).subscribe({
      next: (hebergement: HebergementDTO) => {
        this.hebergement = hebergement;
        this.currentImageIndex = 0;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = "Erreur lors du chargement de l'hebergement";
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }
    if (!this.hasValidStayDates()) {
      this.errorMessage = "La date de depart doit etre apres la date d'arrivee.";
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reservationService.create(this.reservation).subscribe({
      next: () => {
        this.successMessage = 'Votre reservation a ete creee avec succes.';
        this.confirmationModalOpen = true;
        this.isSubmitting = false;
      },
      error: (error: any) => {
        this.errorMessage = error?.error || 'Erreur lors de la creation de la reservation';
        this.isSubmitting = false;
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.reservation.hebergementId > 0 &&
      this.reservation.nomClient &&
      this.reservation.prenomClient &&
      this.reservation.emailClient &&
      this.reservation.telephoneClient &&
      this.reservation.dateArrivee &&
      this.reservation.dateDepart &&
      this.reservation.nombrePersonnes > 0 &&
      this.hasValidStayDates()
    );
  }

  getTotalPrice(): number {
    const nights = this.getNombreNuits();
    if (!this.hebergement || nights <= 0) return 0;
    return nights * this.hebergement.prixParNuit;
  }

  getMinDateArrivee(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getNombreNuits(): number {
    const arrival = this.parseDate(this.reservation.dateArrivee);
    const departure = this.parseDate(this.reservation.dateDepart);
    if (!arrival || !departure) return 0;
    const diffMs = departure.getTime() - arrival.getTime();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  getMinDateDepart(): string {
    if (!this.reservation.dateArrivee) return this.getMinDateArrivee();
    const dateArrivee = new Date(this.reservation.dateArrivee);
    dateArrivee.setDate(dateArrivee.getDate() + 1);
    return dateArrivee.toISOString().split('T')[0];
  }

  get hasMedias(): boolean { return this.imageUrls.length > 0; }
  get currentMediaUrl(): string | null { return this.hasMedias ? (this.imageUrls[this.currentImageIndex] ?? null) : null; }
  get imageUrls(): string[] { return this.hebergement ? this.hebergement.imageUrls || [] : []; }

  previousImage(): void {
    if (!this.hasMedias) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + this.imageUrls.length) % this.imageUrls.length;
  }

  nextImage(): void {
    if (!this.hasMedias) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.imageUrls.length;
  }

  setCurrentImage(index: number): void {
    if (!this.hasMedias) return;
    if (index >= 0 && index < this.imageUrls.length) this.currentImageIndex = index;
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.errorMessage = '';
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      this.errorMessage = '';
    }
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return !!(this.reservation.nomClient && this.reservation.prenomClient && this.reservation.emailClient && this.reservation.telephoneClient);
    }
    if (step === 2) {
      return !!(this.reservation.dateArrivee && this.reservation.dateDepart && this.reservation.nombrePersonnes > 0 && this.hasValidStayDates());
    }
    if (step === 3) {
      return this.isFormValid();
    }
    return false;
  }

  canProceedToNext(): boolean {
    return this.isStepValid(this.currentStep);
  }

  canOpenStep(step: number): boolean {
    if (step <= 1) return true;
    if (step <= this.currentStep) return true;
    for (let i = 1; i < step; i++) {
      if (!this.isStepValid(i)) return false;
    }
    return true;
  }

  hasValidStayDates(): boolean {
    return this.getNombreNuits() > 0;
  }

  closeConfirmationModal(goToList = false): void {
    this.confirmationModalOpen = false;
    if (goToList) this.router.navigate(['/hebergements']);
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
