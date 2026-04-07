import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationHebergementService } from '../../../services/reservation-hebergement.service';
import { ReservationHebergementDTO } from '../../../models/reservation-hebergement.dto';
import { DataTableComponent, TableAction, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { AdminActionsBarComponent } from '../../../shared/components/admin-actions-bar/admin-actions-bar.component';
import { BeButtonComponent } from '../../../shared/components/be-button/be-button.component';

@Component({
  selector: 'app-reservations-hebergement-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, HeaderComponent, AdminActionsBarComponent, BeButtonComponent],
  templateUrl: './reservations-hebergement-admin.component.html',
  styleUrls: ['./reservations-hebergement-admin.component.scss']
})
export class ReservationsHebergementAdminComponent implements OnInit {
  confirmDeleteOpen = false;
  pendingDeleteId: number | null = null;
  actionError = '';


  reservations: ReservationHebergementDTO[] = [];
  filteredReservations: ReservationHebergementDTO[] = [];
  loading = true;
  saving = false;
  showModal = false;
  selectedReservation: ReservationHebergementDTO | null = null;
  modalMode: 'view' | 'edit' = 'view';

  statusFilter = '';
  searchTerm = '';
  successMessage = '';
  errorMessage = '';

  columns: TableColumn[] = [
    { key: 'nomClient', label: 'Client', sortable: true, valueGetter: (item: any) => `${item.prenomClient || ''} ${item.nomClient || ''}`.trim() },
    { key: 'telephoneClient', label: 'Téléphone', sortable: true },
    { key: 'hebergementNom', label: 'Hébergement', sortable: true },
    { key: 'dateArrivee', label: 'Arrivée', sortable: true, type: 'date' },
    { key: 'dateDepart', label: 'Départ', sortable: true, type: 'date' },
    { key: 'nombrePersonnes', label: 'Pers.', sortable: true, width: '70px' },
    { key: 'prixTotal', label: 'Prix', sortable: true, formatter: (v: number) => (v == null ? '-' : `${v} €`) },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status', formatter: (value: string) => this.getStatusLabel(value) },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  tableActions: TableAction[] = [
    { label: 'Voir', icon: 'ri-eye-line', action: 'view', class: 'btn-info' },
    { label: 'Modifier', icon: 'ri-edit-2-line', action: 'edit', class: 'btn-warning' },
    { label: 'Supprimer', icon: 'ri-delete-bin-6-line', action: 'delete', class: 'btn-danger' }
  ];

  constructor(private reservationService: ReservationHebergementService) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.clearMessages();
    this.reservationService.getAll().subscribe({
      next: (data) => {
        this.reservations = data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les reservations.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const term = (this.searchTerm || '').trim().toLowerCase();
    this.filteredReservations = this.reservations.filter(r => {
      const matchesStatus = !this.statusFilter || (r.statut || '').toUpperCase() === this.statusFilter;
      const matchesSearch = !term
        || (r.nomClient || '').toLowerCase().includes(term)
        || (r.prenomClient || '').toLowerCase().includes(term)
        || (r.hebergementNom || '').toLowerCase().includes(term)
        || (r.emailClient || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }

  onStatusFilterChange(): void { this.applyFilters(); }
  onSearchChange(): void { this.applyFilters(); }

  viewReservation(reservation: ReservationHebergementDTO): void {
    this.selectedReservation = { ...reservation };
    this.modalMode = 'view';
    this.showModal = true;
  }

  editReservation(reservation: ReservationHebergementDTO): void {
    this.selectedReservation = { ...reservation };
    this.modalMode = 'edit';
    this.showModal = true;
  }

  quickSetStatus(statut: 'CONFIRMEE' | 'ANNULEE' | 'EN_ATTENTE' | 'TERMINEE'): void {
    if (!this.selectedReservation) return;
    this.selectedReservation.statut = statut;
    this.saveReservation();
  }

  saveReservation(): void {
    if (!this.selectedReservation?.id) return;
    this.saving = true;
    this.clearMessages();

    this.reservationService.update(this.selectedReservation.id, this.selectedReservation).subscribe({
      next: (updated) => {
        const index = this.reservations.findIndex(r => r.id === updated.id);
        if (index !== -1) this.reservations[index] = updated;
        this.applyFilters();
        this.saving = false;
        this.successMessage = 'Reservation mise a jour avec succes.';
        this.closeModal();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error || 'Echec de mise a jour.';
      }
    });
  }

  executeDelete(): void {
    if (this.pendingDeleteId == null) return;
    const id = this.pendingDeleteId;
    this.confirmDeleteOpen = false;
    this.pendingDeleteId = null;
    this.reservationService.delete(id).subscribe({
      next: () => this.loadReservations(),
      error: () => { this.actionError = 'Impossible de supprimer cette réservation.'; }
    });
  }

  deleteReservation(reservation: ReservationHebergementDTO): void {
    if (!reservation.id) return;
    this.pendingDeleteId = reservation.id;
    this.confirmDeleteOpen = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedReservation = null;
  }

  countByStatus(statut: string): number {
    return this.reservations.filter(r => (r.statut || '').toUpperCase() === statut).length;
  }

  getStatusBadgeClass(statut: string): string {
    switch ((statut || '').toUpperCase()) {
      case 'CONFIRMEE': return 'badge-success';
      case 'EN_ATTENTE': return 'badge-warning';
      case 'ANNULEE': return 'badge-danger';
      case 'TERMINEE': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  getStatusIcon(statut: string): string {
    switch ((statut || '').toUpperCase()) {
      case 'CONFIRMEE': return 'ri-checkbox-circle-fill';
      case 'EN_ATTENTE': return 'ri-time-fill';
      case 'ANNULEE': return 'ri-close-circle-fill';
      case 'TERMINEE': return 'ri-flag-fill';
      default: return 'ri-question-fill';
    }
  }

  getStatusLabel(statut?: string): string {
    const normalized = String(statut || '').trim().toUpperCase();
    if (normalized === 'CONFIRMEE') return 'Confirmée';
    if (normalized === 'EN_ATTENTE') return 'En attente';
    if (normalized === 'ANNULEE') return 'Annulée';
    if (normalized === 'TERMINEE') return 'Terminée';
    return normalized || '-';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR');
  }

  onTableAction(event: { action: string; item: ReservationHebergementDTO }): void {
    if (event.action === 'view') this.viewReservation(event.item);
    if (event.action === 'edit') this.editReservation(event.item);
    if (event.action === 'delete') this.deleteReservation(event.item);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price || 0);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
