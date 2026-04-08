import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';
import { ReservationHebergementDTO } from '../../../../models/reservation-hebergement.dto';
import { ReservationHebergementService } from '../../../../services/reservation-hebergement.service';
import {
  ReservationCircuitDTO,
  ReservationsCircuitService
} from '../../../../services/reservations-circuit.service';
import {
  CircuitPersonnaliseDTO,
  CircuitsPersonnalisesService
} from '../../../../services/circuits-personnalises.service';

interface DashboardActivityItem {
  kind: 'hebergement' | 'circuit' | 'sur-mesure';
  title: string;
  date: string;
  status?: string;
  details: string;
  sortDate: number;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  displayName = '';
  firstName = '';
  email = '';
  telephone = '';
  loading = false;
  loaded = false;
  errorMessage = '';

  hebergementReservations: ReservationHebergementDTO[] = [];
  circuitReservations: ReservationCircuitDTO[] = [];
  customCircuitDemandes: CircuitPersonnaliseDTO[] = [];
  recentActivity: DashboardActivityItem[] = [];

  constructor(
    private authService: AuthService,
    private reservationHebergementService: ReservationHebergementService,
    private reservationsCircuitService: ReservationsCircuitService,
    private circuitsPersonnalisesService: CircuitsPersonnalisesService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();

    this.displayName = [user?.prenom, user?.nom]
      .map(value => value?.trim() || '')
      .filter(Boolean)
      .join(' ');

    this.firstName = user?.prenom?.trim() || user?.nom?.trim() || 'voyageur';
    this.email = user?.email?.trim() || '';
    this.telephone = user?.telephone?.trim() || '';

    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.loaded = false;
    this.errorMessage = '';

    forkJoin({
      hebergements: this.reservationHebergementService.getMine().pipe(catchError(() => of([]))),
      circuits: this.reservationsCircuitService.getMine().pipe(catchError(() => of([]))),
      circuitsSurMesure: this.circuitsPersonnalisesService.getMineDemandes().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ hebergements, circuits, circuitsSurMesure }) => {
        this.hebergementReservations = [...(hebergements || [])].sort((a, b) =>
          new Date(b.dateCreation || '').getTime() - new Date(a.dateCreation || '').getTime()
        );
        this.circuitReservations = [...(circuits || [])].sort((a, b) =>
          new Date(b.dateReservation || '').getTime() - new Date(a.dateReservation || '').getTime()
        );
        this.customCircuitDemandes = [...(circuitsSurMesure || [])].sort((a, b) =>
          new Date(b.dateCreation || '').getTime() - new Date(a.dateCreation || '').getTime()
        );
        this.recentActivity = this.buildRecentActivity(
          this.hebergementReservations,
          this.circuitReservations,
          this.customCircuitDemandes
        );
        this.loaded = true;
        this.loading = false;
      },
      error: () => {
        this.loaded = true;
        this.loading = false;
      }
    });
  }

  get totalReservations(): number {
    return this.hebergementReservations.length + this.circuitReservations.length + this.customCircuitDemandes.length;
  }

  get totalHebergements(): number {
    return this.hebergementReservations.length;
  }

  get totalCircuits(): number {
    return this.circuitReservations.length + this.customCircuitDemandes.length;
  }

  get reservationsEnAttente(): number {
    const classicWaiting = [...this.hebergementReservations, ...this.circuitReservations]
      .filter(item => (item.statut || 'EN_ATTENTE').toUpperCase() === 'EN_ATTENTE')
      .length;
    const customWaiting = this.customCircuitDemandes
      .filter(item => ['EN_ATTENTE', 'EN_TRAITEMENT'].includes((item.statut || 'EN_ATTENTE').toUpperCase()))
      .length;
    return classicWaiting + customWaiting;
  }

  get reservationsConfirmees(): number {
    const classicConfirmed = [...this.hebergementReservations, ...this.circuitReservations]
      .filter(item => (item.statut || '').toUpperCase() === 'CONFIRMEE')
      .length;
    const customConfirmed = this.customCircuitDemandes
      .filter(item => (item.statut || '').toUpperCase() === 'ACCEPTE')
      .length;
    return classicConfirmed + customConfirmed;
  }

  getStatusLabel(statut?: string): string {
    switch ((statut || 'EN_ATTENTE').toUpperCase()) {
      case 'CONFIRMEE':
        return 'Confirmee';
      case 'ANNULEE':
        return 'Annulee';
      case 'ACCEPTE':
        return 'Devis valide';
      case 'REFUSE':
        return 'Refuse';
      case 'EN_TRAITEMENT':
        return 'En traitement';
      case 'TERMINEE':
      case 'TERMINE':
        return 'Terminee';
      default:
        return 'En attente';
    }
  }

  getStatusClass(statut?: string): string {
    switch ((statut || 'EN_ATTENTE').toUpperCase()) {
      case 'CONFIRMEE':
        return 'badge-success';
      case 'ANNULEE':
        return 'badge-danger';
      case 'ACCEPTE':
        return 'badge-success';
      case 'REFUSE':
        return 'badge-danger';
      case 'EN_TRAITEMENT':
        return 'badge-info';
      case 'TERMINEE':
      case 'TERMINE':
        return 'badge-info';
      default:
        return 'badge-warning';
    }
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
  }

  private buildRecentActivity(
    hebergements: ReservationHebergementDTO[],
    circuits: ReservationCircuitDTO[],
    customCircuits: CircuitPersonnaliseDTO[]
  ): DashboardActivityItem[] {
    const hebergementItems: DashboardActivityItem[] = hebergements.map(item => ({
      kind: 'hebergement',
      title: item.hebergementNom || 'Hebergement',
      date: item.dateCreation || item.dateArrivee || '',
      status: item.statut,
      details: `${item.nombrePersonnes || 1} voyageur${(item.nombrePersonnes || 1) > 1 ? 's' : ''} · ${item.nombreNuits || 0} nuit${(item.nombreNuits || 0) > 1 ? 's' : ''}`,
      sortDate: new Date(item.dateCreation || item.dateArrivee || '').getTime() || 0
    }));

    const circuitItems: DashboardActivityItem[] = circuits.map(item => ({
      kind: 'circuit',
      title: item.circuitNom || 'Circuit',
      date: item.dateReservation || '',
      status: item.statut,
      details: `${item.nombrePersonnes || 1} voyageur${(item.nombrePersonnes || 1) > 1 ? 's' : ''}`,
      sortDate: new Date(item.dateReservation || '').getTime() || 0
    }));

    const customCircuitItems: DashboardActivityItem[] = customCircuits.map(item => ({
      kind: 'sur-mesure',
      title: item.referenceReservation || 'Circuit sur mesure',
      date: item.dateCreation || '',
      status: item.statut,
      details: `${item.nombreJours || 0} jour${(item.nombreJours || 0) > 1 ? 's' : ''} · ${item.nombrePersonnes || 1} voyageur${(item.nombrePersonnes || 1) > 1 ? 's' : ''}`,
      sortDate: new Date(item.dateCreation || '').getTime() || 0
    }));

    return [...hebergementItems, ...circuitItems, ...customCircuitItems]
      .sort((a, b) => b.sortDate - a.sortDate)
      .slice(0, 4);
  }
}
