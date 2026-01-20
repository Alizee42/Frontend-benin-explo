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
  styleUrls: ['./reservation-hebergement.component.scss']
})
export class ReservationHebergementComponent implements OnInit {

  hebergement: HebergementDTO | null = null;
  currentImageIndex = 0;
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

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private reservationService: ReservationHebergementService,
    private hebergementService: HebergementsService
  ) {}

  ngOnInit(): void {
    const hebergementId = this.route.snapshot.params['id'];
    if (hebergementId) {
      this.loadHebergement(+hebergementId);
      this.reservation.hebergementId = +hebergementId;
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
      error: (error: any) => {
        console.error('Erreur lors du chargement de l\'hébergement:', error);
        this.errorMessage = 'Erreur lors du chargement de l\'hébergement';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reservationService.create(this.reservation).subscribe({
      next: (result: ReservationHebergementDTO) => {
        this.successMessage = 'Votre réservation a été créée avec succès !';
        this.isSubmitting = false;
        // Rediriger vers la page de confirmation ou liste des réservations
        setTimeout(() => {
          this.router.navigate(['/hebergements']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Erreur lors de la création de la réservation:', error);
        this.errorMessage = error.error || 'Erreur lors de la création de la réservation';
        this.isSubmitting = false;
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.reservation.nomClient &&
      this.reservation.prenomClient &&
      this.reservation.emailClient &&
      this.reservation.telephoneClient &&
      this.reservation.dateArrivee &&
      this.reservation.dateDepart &&
      this.reservation.nombrePersonnes > 0
    );
  }

  getTotalPrice(): number {
    if (!this.hebergement || !this.reservation.dateArrivee || !this.reservation.dateDepart) {
      return 0;
    }

    const dateArrivee = new Date(this.reservation.dateArrivee);
    const dateDepart = new Date(this.reservation.dateDepart);
    const diffTime = Math.abs(dateDepart.getTime() - dateArrivee.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays * this.hebergement.prixParNuit;
  }

  getMinDateArrivee(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getNombreNuits(): number {
    if (!this.reservation.dateArrivee || !this.reservation.dateDepart) {
      return 0;
    }

    const dateArrivee = new Date(this.reservation.dateArrivee);
    const dateDepart = new Date(this.reservation.dateDepart);
    const diffTime = Math.abs(dateDepart.getTime() - dateArrivee.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  getMinDateDepart(): string {
    if (!this.reservation.dateArrivee) {
      return this.getMinDateArrivee();
    }
    const dateArrivee = new Date(this.reservation.dateArrivee);
    dateArrivee.setDate(dateArrivee.getDate() + 1);
    return dateArrivee.toISOString().split('T')[0];
  }

  get hasMedias(): boolean {
    return !!this.hebergement && Array.isArray((this.hebergement as any).imageUrls) && (this.hebergement as any).imageUrls.length > 0;
  }

  get currentMediaUrl(): string | null {
    if (!this.hasMedias) {
      return null;
    }
    const imageUrls = (this.hebergement as any).imageUrls as string[];
    return imageUrls[this.currentImageIndex] ?? null;
  }

  previousImage(): void {
    if (!this.hasMedias) {
      return;
    }
    const imageUrls = (this.hebergement as any).imageUrls as string[];
    this.currentImageIndex = (this.currentImageIndex - 1 + imageUrls.length) % imageUrls.length;
  }

  nextImage(): void {
    if (!this.hasMedias) {
      return;
    }
    const imageUrls = (this.hebergement as any).imageUrls as string[];
    this.currentImageIndex = (this.currentImageIndex + 1) % imageUrls.length;
  }
}
