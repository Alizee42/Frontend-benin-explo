import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationHebergementService } from '../../../services/reservation-hebergement.service';
import { ReservationHebergementDTO } from '../../../models/reservation-hebergement.dto';
import { DataTableComponent, TableAction, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { AdminActionsBarComponent } from '../../../shared/components/admin-actions-bar/admin-actions-bar.component';

@Component({
  selector: 'app-reservations-hebergement-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, HeaderComponent, AdminActionsBarComponent],
  templateUrl: './reservations-hebergement-admin.component.html',
  styleUrls: ['./reservations-hebergement-admin.component.scss']
})
export class ReservationsHebergementAdminComponent implements OnInit {

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
    { key: 'id', label: 'ID', sortable: true },
    { key: 'nomClient', label: 'Client', sortable: true },
    { key: 'telephoneClient', label: 'Telephone', sortable: true },
    { key: 'hebergementNom', label: 'Hebergement', sortable: true },
    { key: 'dateArrivee', label: 'Arrivee', sortable: true, type: 'date' },
    { key: 'dateDepart', label: 'Depart', sortable: true, type: 'date' },
    { key: 'nombrePersonnes', label: 'Personnes', sortable: true },
    { key: 'prixTotal', label: 'Prix Total', sortable: true, formatter: (v: number) => (v == null ? '-' : `${v} EUR`) },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status', formatter: (value: string) => this.getStatusLabel(value) },
    { key: 'dateCreation', label: 'Creee le', sortable: true, type: 'date' },
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
        this.successMessage = 'Reservation mise a jour. Le client est notifie si email active.';
        this.closeModal();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error || 'Echec de mise a jour.';
      }
    });
  }

  deleteReservation(reservation: ReservationHebergementDTO): void {
    if (!reservation.id) return;
    if (!confirm(`Supprimer la reservation de ${reservation.nomClient} ${reservation.prenomClient} ?`)) return;

    this.clearMessages();
    this.reservationService.delete(reservation.id).subscribe({
      next: () => {
        this.reservations = this.reservations.filter(r => r.id !== reservation.id);
        this.applyFilters();
        this.successMessage = 'Reservation supprimee.';
      },
      error: () => {
        this.errorMessage = 'Suppression impossible.';
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedReservation = null;
  }

  getStatusBadgeClass(statut: string): string {
    switch ((statut || '').toLowerCase()) {
      case 'confirmee': return 'badge-success';
      case 'en_attente': return 'badge-warning';
      case 'annulee': return 'badge-danger';
      case 'terminee': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  getStatusLabel(statut?: string): string {
    const normalized = String(statut || '').trim().toUpperCase();
    if (normalized === 'CONFIRMEE') return 'Confirmee';
    if (normalized === 'EN_ATTENTE') return 'En attente';
    if (normalized === 'ANNULEE') return 'Annulee';
    if (normalized === 'TERMINEE') return 'Terminee';
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
