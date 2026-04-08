import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ReservationHebergementService } from '../../../../services/reservation-hebergement.service';
import { ReservationHebergementDTO } from '../../../../models/reservation-hebergement.dto';
import { AuthService } from '../../../../services/auth.service';
import {
  ReservationCircuitDTO,
  ReservationsCircuitService
} from '../../../../services/reservations-circuit.service';
import { DataTableComponent, TableAction, TableColumn } from '../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-mes-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent],
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

  activeTab: 'hebergements' | 'circuits' = 'hebergements';
  statusFilter = '';

  hebergementColumns: TableColumn[] = [
    { key: 'hebergementNom', label: 'Hebergement', sortable: true },
    { key: 'dateArrivee', label: 'Arrivee', sortable: true, type: 'date' },
    { key: 'dateDepart', label: 'Depart', sortable: true, type: 'date' },
    { key: 'nombreNuits', label: 'Nuits', sortable: true, width: '100px' },
    { key: 'statutPaiement', label: 'Paiement', sortable: true, type: 'status', formatter: (v) => this.getPaymentStatusLabel(v) },
    { key: 'prixTotal', label: 'Prix', sortable: true, formatter: (v) => v != null ? `${Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} EUR` : '-' },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status', formatter: (v) => this.getStatusLabel(v) },
    { key: 'actions', label: '', type: 'actions' }
  ];

  hebergementActions: TableAction[] = [
    {
      label: 'Payer',
      icon: 'ri-bank-card-line',
      action: 'pay',
      class: 'btn-success',
      condition: (item: ReservationHebergementDTO) => this.canPayReservation(item)
    }
  ];

  circuitColumns: TableColumn[] = [
    { key: 'circuitNom', label: 'Circuit', sortable: true },
    { key: 'dateReservation', label: 'Date', sortable: true, type: 'date' },
    { key: 'nombrePersonnes', label: 'Pers.', sortable: true, width: '65px' },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status', formatter: (v) => this.getStatusLabel(v) }
  ];

  constructor(
    private reservationService: ReservationHebergementService,
    private reservationsCircuitService: ReservationsCircuitService,
    private authService: AuthService,
    private router: Router
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
      .map((v) => v?.trim() || '')
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
        this.activeTab = this.hebergementReservations.length > 0 ? 'hebergements' : 'circuits';
        this.statusFilter = '';
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

  get filteredHebergements(): ReservationHebergementDTO[] {
    if (!this.statusFilter) return this.hebergementReservations;
    return this.hebergementReservations.filter(
      (r) => (r.statut || 'EN_ATTENTE').toUpperCase() === this.statusFilter
    );
  }

  get filteredCircuits(): ReservationCircuitDTO[] {
    if (!this.statusFilter) return this.circuitReservations;
    return this.circuitReservations.filter(
      (r) => (r.statut || 'EN_ATTENTE').toUpperCase() === this.statusFilter
    );
  }

  get currentCount(): number {
    return this.activeTab === 'hebergements'
      ? this.filteredHebergements.length
      : this.filteredCircuits.length;
  }

  setTab(tab: 'hebergements' | 'circuits'): void {
    this.activeTab = tab;
    this.statusFilter = '';
  }

  onTableAction(event: { action: string; item: ReservationHebergementDTO }): void {
    if (event.action === 'pay' && event.item.id) {
      this.router.navigate(['/paiement/hebergement', event.item.id]);
    }
  }

  getStatusLabel(statut?: string): string {
    const s = (statut || 'EN_ATTENTE').toUpperCase();
    if (s === 'CONFIRMEE') return 'Confirmee';
    if (s === 'EN_ATTENTE') return 'En attente';
    if (s === 'ANNULEE') return 'Annulee';
    if (s === 'TERMINEE') return 'Terminee';
    return s;
  }

  getPaymentStatusLabel(statut?: string): string {
    switch ((statut || '').toUpperCase()) {
      case 'PAYE': return 'Paye';
      case 'EN_COURS': return 'En cours';
      case 'ECHEC': return 'Echec';
      case 'REMBOURSE': return 'Rembourse';
      default: return 'A payer';
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
