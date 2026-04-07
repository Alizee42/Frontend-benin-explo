import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ReservationHebergementService } from '../../../../services/reservation-hebergement.service';
import { ReservationHebergementDTO } from '../../../../models/reservation-hebergement.dto';
import { AuthService } from '../../../../services/auth.service';
import {
  ReservationCircuitDTO,
  ReservationsCircuitService
} from '../../../../services/reservations-circuit.service';

@Component({
  selector: 'app-mes-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mes-reservations.component.html',
  styleUrls: ['./mes-reservations.component.scss']
})
export class MesReservationsComponent implements OnInit {
  accountEmail = '';
  accountDisplayName = '';
  hebergementReservations: ReservationHebergementDTO[] = [];
  circuitReservations: ReservationCircuitDTO[] = [];
  loading = false;
  loaded = false;
  errorMessage = '';

  constructor(
    private reservationService: ReservationHebergementService,
    private reservationsCircuitService: ReservationsCircuitService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    const email = user?.email?.trim() || '';

    if (!email) {
      this.errorMessage = "Impossible d'identifier votre compte.";
      this.loaded = true;
      return;
    }

    this.accountEmail = email;
    this.accountDisplayName = [user?.prenom, user?.nom]
      .map((value) => value?.trim() || '')
      .filter(Boolean)
      .join(' ');

    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      hebergements: this.reservationService.getMine(),
      circuits: this.reservationsCircuitService.getMine()
    }).subscribe({
      next: ({ hebergements, circuits }) => {
        this.hebergementReservations = [...(hebergements || [])].sort((a, b) =>
          new Date(b.dateCreation || '').getTime() - new Date(a.dateCreation || '').getTime()
        );
        this.circuitReservations = [...(circuits || [])].sort((a, b) =>
          new Date(b.dateReservation || '').getTime() - new Date(a.dateReservation || '').getTime()
        );
        this.loaded = true;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de recuperer les reservations liees a votre compte.';
        this.loaded = true;
        this.loading = false;
      }
    });
  }

  get totalReservations(): number {
    return this.hebergementReservations.length + this.circuitReservations.length;
  }

  getStatusLabel(statut?: string): string {
    const s = (statut || 'EN_ATTENTE').toUpperCase();
    if (s === 'CONFIRMEE') return 'Confirmee';
    if (s === 'EN_ATTENTE') return 'En attente';
    if (s === 'ANNULEE') return 'Annulee';
    if (s === 'TERMINEE') return 'Terminee';
    return s;
  }

  getStatusClass(statut?: string): string {
    switch ((statut || 'EN_ATTENTE').toUpperCase()) {
      case 'CONFIRMEE': return 'badge-success';
      case 'EN_ATTENTE': return 'badge-warning';
      case 'ANNULEE': return 'badge-danger';
      case 'TERMINEE': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  formatDate(d?: string): string {
    if (!d) return '';
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR');
  }

  formatDateTime(d?: string): string {
    if (!d) return '';
    const date = new Date(d);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
  }

  getNuits(r: ReservationHebergementDTO): number {
    return r.nombreNuits || 0;
  }

  getPaymentStatusLabel(statut?: string): string {
    switch ((statut || '').toUpperCase()) {
      case 'PAYE': return 'Paye';
      case 'EN_COURS': return 'En cours';
      case 'ECHEC': return 'Echec';
      case 'REMBOURSE': return 'Rembourse';
      case 'A_PAYER': return 'A payer';
      default: return 'Non renseigne';
    }
  }

  getPaymentStatusClass(statut?: string): string {
    switch ((statut || '').toUpperCase()) {
      case 'PAYE': return 'badge-success';
      case 'EN_COURS': return 'badge-info';
      case 'ECHEC': return 'badge-danger';
      case 'REMBOURSE': return 'badge-secondary';
      case 'A_PAYER': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  canPayReservation(reservation: ReservationHebergementDTO): boolean {
    const reservationStatus = (reservation.statut || 'EN_ATTENTE').toUpperCase();
    const paymentStatus = (reservation.statutPaiement || '').toUpperCase();
    return !!reservation.id
      && reservationStatus !== 'ANNULEE'
      && paymentStatus !== 'PAYE'
      && paymentStatus !== 'REMBOURSE';
  }
}
