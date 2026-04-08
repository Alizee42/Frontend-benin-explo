import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReservationHebergementDTO } from '../../../models/reservation-hebergement.dto';
import { ReservationHebergementService } from '../../../services/reservation-hebergement.service';
import { ReservationCircuitDTO, ReservationsCircuitService } from '../../../services/reservations-circuit.service';
import {
  CircuitPersonnaliseDTO,
  CircuitsPersonnalisesService
} from '../../../services/circuits-personnalises.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { AdminActionsBarComponent } from '../../../shared/components/admin-actions-bar/admin-actions-bar.component';
import { DataTableComponent, TableAction, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { BeButtonComponent } from '../../../shared/components/be-button/be-button.component';

@Component({
  selector: 'app-reservations-clients-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    AdminActionsBarComponent,
    DataTableComponent,
    ModalComponent,
    BeButtonComponent
  ],
  templateUrl: './reservations-clients-admin.component.html',
  styleUrls: ['./reservations-clients-admin.component.scss']
})
export class ReservationsClientsAdminComponent implements OnInit {
  loading = true;
  successMessage = '';
  errorMessage = '';

  activeTab: 'hebergements' | 'circuits' | 'surMesure' = 'hebergements';
  statusFilter = '';
  searchTerm = '';

  hebergementReservations: ReservationHebergementDTO[] = [];
  circuitReservations: ReservationCircuitDTO[] = [];
  customCircuitDemandes: CircuitPersonnaliseDTO[] = [];

  hebergementModalOpen = false;
  hebergementModalMode: 'view' | 'edit' = 'view';
  confirmDeleteOpen = false;
  pendingDeleteId: number | null = null;
  selectedHebergement: ReservationHebergementDTO | null = null;
  saving = false;

  circuitModalOpen = false;
  selectedCircuitReservation: ReservationCircuitDTO | null = null;
  circuitSaving = false;
  confirmCircuitDeleteOpen = false;
  pendingCircuitDeleteId: number | null = null;

  hebergementColumns: TableColumn[] = [
    { key: 'referenceReservation', label: 'Reference', sortable: true, width: '145px' },
    { key: 'nomClient', label: 'Client', sortable: true, valueGetter: (item: ReservationHebergementDTO) => `${item.prenomClient || ''} ${item.nomClient || ''}`.trim() },
    { key: 'hebergementNom', label: 'Hebergement', sortable: true },
    { key: 'dateArrivee', label: 'Arrivee', sortable: true, type: 'date' },
    { key: 'dateDepart', label: 'Depart', sortable: true, type: 'date' },
    { key: 'statutPaiement', label: 'Paiement', sortable: true, type: 'status', formatter: (value: string) => this.getPaymentStatusLabel(value) },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status', formatter: (value: string) => this.getStatusLabel(value) },
    { key: 'actions', label: 'Actions', type: 'actions', width: '120px' }
  ];

  hebergementActions: TableAction[] = [
    { label: 'Voir', icon: 'ri-eye-line', action: 'view', class: 'btn-info' },
    { label: 'Modifier', icon: 'ri-edit-2-line', action: 'edit', class: 'btn-warning' },
    { label: 'Supprimer', icon: 'ri-delete-bin-6-line', action: 'delete', class: 'btn-danger' }
  ];

  circuitColumns: TableColumn[] = [
    { key: 'referenceReservation', label: 'Reference', sortable: true, width: '145px' },
    { key: 'nom', label: 'Client', sortable: true, valueGetter: (item: ReservationCircuitDTO) => `${item.prenom || ''} ${item.nom || ''}`.trim() },
    { key: 'circuitNom', label: 'Circuit', sortable: true },
    { key: 'dateReservation', label: 'Date', sortable: true, type: 'date' },
    { key: 'nombrePersonnes', label: 'Pers.', sortable: true, width: '70px' },
    { key: 'statutPaiement', label: 'Paiement', sortable: true, type: 'status', formatter: (value: string) => this.getPaymentStatusLabel(value) },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status', formatter: (value: string) => this.getStatusLabel(value) },
    { key: 'actions', label: 'Actions', type: 'actions', width: '100px' }
  ];

  circuitActions: TableAction[] = [
    { label: 'Voir', icon: 'ri-eye-line', action: 'view', class: 'btn-info' },
    { label: 'Supprimer', icon: 'ri-delete-bin-6-line', action: 'delete', class: 'btn-danger' }
  ];

  customColumns: TableColumn[] = [
    { key: 'referenceReservation', label: 'Reference', sortable: true, width: '145px' },
    { key: 'nomClient', label: 'Client', sortable: true, valueGetter: (item: CircuitPersonnaliseDTO) => `${item.prenomClient || ''} ${item.nomClient || ''}`.trim() },
    { key: 'dateCreation', label: 'Demande', sortable: true, type: 'date' },
    { key: 'dateVoyageSouhaitee', label: 'Voyage', sortable: true, type: 'date' },
    { key: 'prixFinal', label: 'Devis valide', sortable: true, formatter: (value: number) => this.formatPrice(value) },
    { key: 'statutPaiement', label: 'Paiement', sortable: true, type: 'status', formatter: (value: string) => this.getPaymentStatusLabel(value) },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status', formatter: (value: string) => this.getCustomStatusLabel(value) },
    { key: 'actions', label: 'Actions', type: 'actions', width: '100px' }
  ];

  customActions: TableAction[] = [
    { label: 'Ouvrir', icon: 'ri-external-link-line', action: 'open', class: 'btn-info' }
  ];

  constructor(
    private reservationHebergementService: ReservationHebergementService,
    private reservationsCircuitService: ReservationsCircuitService,
    private circuitsPersonnalisesService: CircuitsPersonnalisesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    forkJoin({
      hebergements: this.reservationHebergementService.getAll().pipe(
        catchError(() => {
          return of([] as ReservationHebergementDTO[]);
        })
      ),
      circuits: this.reservationsCircuitService.getAll().pipe(
        catchError(() => {
          return of([] as ReservationCircuitDTO[]);
        })
      ),
      surMesure: this.circuitsPersonnalisesService.getAllDemandes().pipe(
        catchError(() => {
          return of([] as CircuitPersonnaliseDTO[]);
        })
      )
    }).subscribe({
      next: ({ hebergements, circuits, surMesure }) => {
        this.hebergementReservations = [...(hebergements || [])].sort((a, b) =>
          new Date(b.dateCreation || '').getTime() - new Date(a.dateCreation || '').getTime()
        );
        this.circuitReservations = [...(circuits || [])].sort((a, b) =>
          new Date(b.dateReservation || '').getTime() - new Date(a.dateReservation || '').getTime()
        );
        this.customCircuitDemandes = [...(surMesure || [])].sort((a, b) =>
          new Date(b.dateCreation || '').getTime() - new Date(a.dateCreation || '').getTime()
        );
        this.activeTab = this.resolveInitialTab();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les reservations clients.';
        this.loading = false;
      }
    });
  }

  get totalClientReservations(): number {
    return this.hebergementReservations.length + this.circuitReservations.length + this.customCircuitDemandes.length;
  }

  get paidReservationsCount(): number {
    return this.hebergementReservations.filter((item) => (item.statutPaiement || '').toUpperCase() === 'PAYE').length
      + this.circuitReservations.filter((item) => (item.statutPaiement || '').toUpperCase() === 'PAYE').length
      + this.customCircuitDemandes.filter((item) => (item.statutPaiement || '').toUpperCase() === 'PAYE').length;
  }

  get pendingClientRequestsCount(): number {
    return this.hebergementReservations.filter((item) => (item.statut || 'EN_ATTENTE').toUpperCase() === 'EN_ATTENTE').length
      + this.circuitReservations.filter((item) => (item.statut || 'EN_ATTENTE').toUpperCase() === 'EN_ATTENTE').length
      + this.customCircuitDemandes.filter((item) => ['EN_ATTENTE', 'EN_TRAITEMENT'].includes((item.statut || 'EN_ATTENTE').toUpperCase())).length;
  }

  get statusOptions(): Array<{ value: string; label: string }> {
    if (this.activeTab === 'surMesure') {
      return [
        { value: '', label: 'Tous les statuts' },
        { value: 'EN_ATTENTE', label: 'En attente' },
        { value: 'EN_TRAITEMENT', label: 'En traitement' },
        { value: 'ACCEPTE', label: 'Devis valide' },
        { value: 'REFUSE', label: 'Refuse' },
        { value: 'TERMINE', label: 'Termine' }
      ];
    }

    return [
      { value: '', label: 'Tous les statuts' },
      { value: 'EN_ATTENTE', label: 'En attente' },
      { value: 'CONFIRMEE', label: 'Confirmee' },
      { value: 'TERMINEE', label: 'Terminee' },
      { value: 'ANNULEE', label: 'Annulee' }
    ];
  }

  get filteredHebergements(): ReservationHebergementDTO[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    return this.hebergementReservations.filter((reservation) => {
      const matchesStatus = !this.statusFilter || (reservation.statut || 'EN_ATTENTE').toUpperCase() === this.statusFilter;
      const matchesSearch = !term
        || (reservation.referenceReservation || '').toLowerCase().includes(term)
        || (reservation.nomClient || '').toLowerCase().includes(term)
        || (reservation.prenomClient || '').toLowerCase().includes(term)
        || (reservation.emailClient || '').toLowerCase().includes(term)
        || (reservation.hebergementNom || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }

  get filteredCircuits(): ReservationCircuitDTO[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    return this.circuitReservations.filter((reservation) => {
      const matchesStatus = !this.statusFilter || (reservation.statut || 'EN_ATTENTE').toUpperCase() === this.statusFilter;
      const matchesSearch = !term
        || (reservation.referenceReservation || '').toLowerCase().includes(term)
        || (reservation.nom || '').toLowerCase().includes(term)
        || (reservation.prenom || '').toLowerCase().includes(term)
        || (reservation.email || '').toLowerCase().includes(term)
        || (reservation.telephone || '').toLowerCase().includes(term)
        || (reservation.circuitNom || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }

  get filteredCustomCircuits(): CircuitPersonnaliseDTO[] {
    const term = (this.searchTerm || '').trim().toLowerCase();
    return this.customCircuitDemandes.filter((demande) => {
      const matchesStatus = !this.statusFilter || (demande.statut || 'EN_ATTENTE').toUpperCase() === this.statusFilter;
      const matchesSearch = !term
        || (demande.referenceReservation || '').toLowerCase().includes(term)
        || (demande.nomClient || '').toLowerCase().includes(term)
        || (demande.prenomClient || '').toLowerCase().includes(term)
        || (demande.emailClient || '').toLowerCase().includes(term)
        || (demande.telephoneClient || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
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
    if (event.action === 'view') {
      this.selectedHebergement = { ...event.item };
      this.hebergementModalMode = 'view';
      this.hebergementModalOpen = true;
    }
    if (event.action === 'edit') {
      this.selectedHebergement = { ...event.item };
      this.hebergementModalMode = 'edit';
      this.hebergementModalOpen = true;
    }
    if (event.action === 'delete' && event.item.id) {
      this.pendingDeleteId = event.item.id;
      this.confirmDeleteOpen = true;
    }
  }

  onCustomAction(event: { action: string; item: CircuitPersonnaliseDTO }): void {
    if (event.action === 'open' && event.item.id) {
      this.router.navigate(['/admin/circuits-personnalises/detail', event.item.id]);
    }
  }

  onCircuitAction(event: { action: string; item: ReservationCircuitDTO }): void {
    if (event.action === 'view') {
      this.selectedCircuitReservation = { ...event.item };
      this.circuitModalOpen = true;
    }
    if (event.action === 'delete' && event.item.id) {
      this.pendingCircuitDeleteId = event.item.id;
      this.confirmCircuitDeleteOpen = true;
    }
  }

  quickSetHebergementStatus(statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'TERMINEE'): void {
    if (!this.selectedHebergement) {
      return;
    }
    this.selectedHebergement.statut = statut;
    this.saveHebergement();
  }

  saveHebergement(): void {
    if (!this.selectedHebergement?.id) {
      return;
    }

    this.saving = true;
    this.reservationHebergementService.update(this.selectedHebergement.id, this.selectedHebergement).subscribe({
      next: (updated) => {
        const index = this.hebergementReservations.findIndex((item) => item.id === updated.id);
        if (index !== -1) {
          this.hebergementReservations[index] = updated;
        }
        this.saving = false;
        this.successMessage = 'Reservation hebergement mise a jour.';
        this.closeHebergementModal();
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Echec de la mise a jour de la reservation hebergement.';
      }
    });
  }

  quickSetCircuitStatus(statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'TERMINEE'): void {
    if (!this.selectedCircuitReservation) {
      return;
    }
    this.selectedCircuitReservation.statut = statut;
    this.saveCircuitReservation();
  }

  saveCircuitReservation(): void {
    if (!this.selectedCircuitReservation?.id) {
      return;
    }

    this.circuitSaving = true;
    this.reservationsCircuitService.update(this.selectedCircuitReservation.id, this.selectedCircuitReservation).subscribe({
      next: (updated) => {
        const index = this.circuitReservations.findIndex((item) => item.id === updated.id);
        if (index !== -1) {
          this.circuitReservations[index] = updated;
        }
        this.circuitSaving = false;
        this.successMessage = 'Reservation circuit mise a jour.';
        this.closeCircuitModal();
      },
      error: () => {
        this.circuitSaving = false;
        this.errorMessage = 'Echec de la mise a jour de la reservation circuit.';
      }
    });
  }

  executeDelete(): void {
    if (this.pendingDeleteId == null) {
      return;
    }
    const id = this.pendingDeleteId;
    this.confirmDeleteOpen = false;
    this.pendingDeleteId = null;

    this.reservationHebergementService.delete(id).subscribe({
      next: () => {
        this.hebergementReservations = this.hebergementReservations.filter((item) => item.id !== id);
        this.successMessage = 'Reservation hebergement supprimee.';
      },
      error: () => {
        this.errorMessage = 'Impossible de supprimer cette reservation hebergement.';
      }
    });
  }

  executeCircuitDelete(): void {
    if (this.pendingCircuitDeleteId == null) {
      return;
    }
    const id = this.pendingCircuitDeleteId;
    this.confirmCircuitDeleteOpen = false;
    this.pendingCircuitDeleteId = null;

    this.reservationsCircuitService.delete(id).subscribe({
      next: () => {
        this.circuitReservations = this.circuitReservations.filter((item) => item.id !== id);
        this.successMessage = 'Reservation circuit supprimee.';
      },
      error: () => {
        this.errorMessage = 'Impossible de supprimer cette reservation circuit.';
      }
    });
  }

  closeHebergementModal(): void {
    this.hebergementModalOpen = false;
    this.selectedHebergement = null;
    this.hebergementModalMode = 'view';
  }

  closeCircuitModal(): void {
    this.circuitModalOpen = false;
    this.selectedCircuitReservation = null;
  }

  formatDate(value?: string): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
  }

  formatDateTime(value?: string): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '-'
      : date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
  }

  formatPrice(value?: number): string {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return '-';
    }
    return `${new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)} EUR`;
  }

  getStatusLabel(statut?: string): string {
    const normalized = (statut || 'EN_ATTENTE').toUpperCase();
    if (normalized === 'CONFIRMEE') return 'Confirmee';
    if (normalized === 'ANNULEE') return 'Annulee';
    if (normalized === 'TERMINEE') return 'Terminee';
    return 'En attente';
  }

  getCustomStatusLabel(statut?: string): string {
    const normalized = (statut || 'EN_ATTENTE').toUpperCase();
    if (normalized === 'ACCEPTE') return 'Devis valide';
    if (normalized === 'REFUSE') return 'Refuse';
    if (normalized === 'EN_TRAITEMENT') return 'En traitement';
    if (normalized === 'TERMINE') return 'Termine';
    return 'En attente';
  }

  getStatusBadgeClass(statut?: string): string {
    const normalized = (statut || 'EN_ATTENTE').toUpperCase();
    if (normalized === 'CONFIRMEE') return 'badge-success';
    if (normalized === 'ANNULEE') return 'badge-danger';
    if (normalized === 'TERMINEE') return 'badge-info';
    return 'badge-warning';
  }

  getCustomStatusBadgeClass(statut?: string): string {
    const normalized = (statut || 'EN_ATTENTE').toUpperCase();
    if (normalized === 'ACCEPTE') return 'badge-success';
    if (normalized === 'REFUSE') return 'badge-danger';
    if (normalized === 'EN_TRAITEMENT') return 'badge-info';
    if (normalized === 'TERMINE') return 'badge-secondary';
    return 'badge-warning';
  }

  getStatusIcon(statut?: string): string {
    const normalized = (statut || 'EN_ATTENTE').toUpperCase();
    if (normalized === 'CONFIRMEE') return 'ri-checkbox-circle-fill';
    if (normalized === 'ANNULEE') return 'ri-close-circle-fill';
    if (normalized === 'TERMINEE') return 'ri-flag-fill';
    return 'ri-time-fill';
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

  private resolveInitialTab(): 'hebergements' | 'circuits' | 'surMesure' {
    if (this.hebergementReservations.length > 0) {
      return 'hebergements';
    }
    if (this.circuitReservations.length > 0) {
      return 'circuits';
    }
    return 'surMesure';
  }
}
