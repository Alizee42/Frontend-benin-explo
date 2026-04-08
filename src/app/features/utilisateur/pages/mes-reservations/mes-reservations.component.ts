import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReservationHebergementService } from '../../../../services/reservation-hebergement.service';
import { ReservationHebergementDTO } from '../../../../models/reservation-hebergement.dto';
import { AuthService } from '../../../../services/auth.service';
import {
  ReservationCircuitDTO,
  ReservationsCircuitService
} from '../../../../services/reservations-circuit.service';
import {
  CircuitPersonnaliseDTO,
  CircuitsPersonnalisesService
} from '../../../../services/circuits-personnalises.service';
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
  customCircuitDemandes: CircuitPersonnaliseDTO[] = [];
  loading = false;
  loaded = false;
  errorMessage = '';

  activeTab: 'hebergements' | 'circuits' | 'surMesure' = 'hebergements';
  statusFilter = '';

  hebergementColumns: TableColumn[] = [
    { key: 'referenceReservation', label: 'Reference', sortable: true, width: '140px' },
    { key: 'hebergementNom', label: 'Hebergement', sortable: true },
    { key: 'dateArrivee', label: 'Arrivee', sortable: true, type: 'date' },
    { key: 'dateDepart', label: 'Depart', sortable: true, type: 'date' },
    { key: 'nombreNuits', label: 'Nuits', sortable: true, width: '100px' },
    { key: 'statutPaiement', label: 'Paiement', sortable: true, type: 'status', formatter: (v) => this.getPaymentStatusLabel(v) },
    { key: 'prixTotal', label: 'Prix', sortable: true, formatter: (v) => v != null ? `${Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} EUR` : '-' },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status', formatter: (v) => this.getStatusLabel(v) },
    { key: 'actions', label: 'Actions', type: 'actions', width: '150px' }
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
    { key: 'referenceReservation', label: 'Reference', sortable: true, width: '140px' },
    { key: 'circuitNom', label: 'Circuit', sortable: true },
    { key: 'dateReservation', label: 'Date', sortable: true, type: 'date' },
    { key: 'nombrePersonnes', label: 'Pers.', sortable: true, width: '65px' },
    { key: 'statutPaiement', label: 'Paiement', sortable: true, type: 'status', formatter: (v) => this.getPaymentStatusLabel(v) },
    { key: 'prixTotal', label: 'Prix', sortable: true, formatter: (v) => v != null ? `${Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} EUR` : '-' },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status', formatter: (v) => this.getStatusLabel(v) },
    { key: 'actions', label: 'Actions', type: 'actions', width: '150px' }
  ];

  circuitActions: TableAction[] = [
    {
      label: 'Payer',
      icon: 'ri-bank-card-line',
      action: 'pay',
      class: 'btn-success',
      condition: (item: ReservationCircuitDTO) => this.canPayCircuitReservation(item)
    }
  ];

  customCircuitColumns: TableColumn[] = [
    { key: 'referenceReservation', label: 'Reference', sortable: true, width: '140px' },
    { key: 'dateCreation', label: 'Demande', sortable: true, type: 'date' },
    { key: 'nombreJours', label: 'Jours', sortable: true, width: '70px' },
    { key: 'nombrePersonnes', label: 'Pers.', sortable: true, width: '65px' },
    { key: 'prixFinal', label: 'Devis valide', sortable: true, formatter: (v) => v != null ? `${Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} EUR` : '-' },
    { key: 'statutPaiement', label: 'Paiement', sortable: true, type: 'status', formatter: (v) => this.getPaymentStatusLabel(v) },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status', formatter: (v) => this.getCustomStatusLabel(v) },
    { key: 'actions', label: 'Actions', type: 'actions', width: '150px' }
  ];

  customCircuitActions: TableAction[] = [
    {
      label: 'Payer',
      icon: 'ri-bank-card-line',
      action: 'pay',
      class: 'btn-success',
      condition: (item: CircuitPersonnaliseDTO) => this.canPayCustomCircuit(item)
    }
  ];

  constructor(
    private reservationService: ReservationHebergementService,
    private reservationsCircuitService: ReservationsCircuitService,
    private circuitsPersonnalisesService: CircuitsPersonnalisesService,
    private authService: AuthService,
    public router: Router
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
      hebergements: this.reservationService.getMine().pipe(catchError(() => of([]))),
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
        this.loaded = true;
        this.loading = false;
        this.activeTab = this.hebergementReservations.length > 0
          ? 'hebergements'
          : (this.circuitReservations.length > 0 ? 'circuits' : 'surMesure');
        this.statusFilter = '';
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

  get filteredCustomCircuits(): CircuitPersonnaliseDTO[] {
    if (!this.statusFilter) return this.customCircuitDemandes;
    return this.customCircuitDemandes.filter(
      (r) => (r.statut || 'EN_ATTENTE').toUpperCase() === this.statusFilter
    );
  }

  get currentCount(): number {
    if (this.activeTab === 'hebergements') {
      return this.filteredHebergements.length;
    }
    if (this.activeTab === 'circuits') {
      return this.filteredCircuits.length;
    }
    return this.filteredCustomCircuits.length;
  }

  setTab(tab: 'hebergements' | 'circuits' | 'surMesure'): void {
    this.activeTab = tab;
    this.statusFilter = '';
  }

  onHebergementAction(event: { action: string; item: ReservationHebergementDTO }): void {
    if (event.action === 'pay' && event.item.id) {
      this.router.navigate(['/paiement/hebergement', event.item.id]);
    }
  }

  onCircuitAction(event: { action: string; item: ReservationCircuitDTO }): void {
    if (event.action === 'pay' && event.item.id) {
      this.router.navigate(['/paiement/circuit', event.item.id]);
    }
  }

  onCustomCircuitAction(event: { action: string; item: CircuitPersonnaliseDTO }): void {
    if (event.action === 'pay' && event.item.id) {
      this.router.navigate(['/paiement/circuit-personnalise', event.item.id]);
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

  getCustomStatusLabel(statut?: string): string {
    const s = (statut || 'EN_ATTENTE').toUpperCase();
    if (s === 'ACCEPTE') return 'Devis valide';
    if (s === 'REFUSE') return 'Refuse';
    if (s === 'EN_TRAITEMENT') return 'En traitement';
    if (s === 'TERMINE') return 'Termine';
    return 'En attente';
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

  getPaymentBadgeClass(statut?: string): string {
    switch ((statut || '').toUpperCase()) {
      case 'PAYE': return 'badge-success';
      case 'EN_COURS': return 'badge-info';
      case 'ECHEC': return 'badge-danger';
      case 'REMBOURSE': return 'badge-secondary';
      default: return 'badge-warning';
    }
  }

  getStatusBadgeClass(statut?: string): string {
    switch ((statut || 'EN_ATTENTE').toUpperCase()) {
      case 'CONFIRMEE': return 'badge-success';
      case 'EN_ATTENTE': return 'badge-warning';
      case 'ANNULEE': return 'badge-danger';
      case 'TERMINEE': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  getCustomStatusBadgeClass(statut?: string): string {
    switch ((statut || 'EN_ATTENTE').toUpperCase()) {
      case 'ACCEPTE': return 'badge-success';
      case 'EN_ATTENTE': return 'badge-warning';
      case 'EN_TRAITEMENT': return 'badge-info';
      case 'REFUSE': return 'badge-danger';
      case 'TERMINE': return 'badge-secondary';
      default: return 'badge-warning';
    }
  }

  formatDate(value?: string): string {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
  }

  canPayReservation(reservation: ReservationHebergementDTO): boolean {
    const reservationStatus = (reservation.statut || 'EN_ATTENTE').toUpperCase();
    const paymentStatus = (reservation.statutPaiement || '').toUpperCase();
    return !!reservation.id
      && reservationStatus !== 'ANNULEE'
      && paymentStatus !== 'PAYE'
      && paymentStatus !== 'REMBOURSE';
  }

  canPayCircuitReservation(reservation: ReservationCircuitDTO): boolean {
    const reservationStatus = (reservation.statut || 'EN_ATTENTE').toUpperCase();
    const paymentStatus = (reservation.statutPaiement || '').toUpperCase();
    return !!reservation.id
      && reservationStatus !== 'ANNULEE'
      && paymentStatus !== 'PAYE'
      && paymentStatus !== 'REMBOURSE'
      && (reservation.prixTotal || 0) > 0;
  }

  canPayCustomCircuit(demande: CircuitPersonnaliseDTO): boolean {
    const demandeStatus = (demande.statut || 'EN_ATTENTE').toUpperCase();
    const paymentStatus = (demande.statutPaiement || '').toUpperCase();
    return !!demande.id
      && demandeStatus === 'ACCEPTE'
      && paymentStatus !== 'PAYE'
      && paymentStatus !== 'REMBOURSE'
      && (demande.prixFinal || 0) > 0;
  }
}
