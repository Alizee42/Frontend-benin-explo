import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationHebergementService } from '../../../services/reservation-hebergement.service';
import { ReservationHebergementDTO } from '../../../models/reservation-hebergement.dto';
import { DataTableComponent, TableAction, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-reservations-hebergement-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, HeaderComponent],
  templateUrl: './reservations-hebergement-admin.component.html',
  styleUrls: ['./reservations-hebergement-admin.component.scss']
})
export class ReservationsHebergementAdminComponent implements OnInit {

  reservations: ReservationHebergementDTO[] = [];
  filteredReservations: ReservationHebergementDTO[] = [];
  loading = true;
  showModal = false;
  selectedReservation: ReservationHebergementDTO | null = null;
  modalMode: 'view' | 'edit' = 'view';

  // Filtres
  statusFilter = '';
  searchTerm = '';

  get totalReservations(): number {
    return this.reservations.length;
  }

  // Colonnes pour le tableau
  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'nomClient', label: 'Client', sortable: true },
    { key: 'hebergementNom', label: 'Hébergement', sortable: true },
    { key: 'dateArrivee', label: 'Arrivée', sortable: true, type: 'date' },
    { key: 'dateDepart', label: 'Départ', sortable: true, type: 'date' },
    { key: 'prixTotal', label: 'Prix Total', sortable: true, formatter: (value: number) => (value === null || value === undefined ? '-' : `${value}€`) },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status', formatter: (value: string) => this.getStatusLabel(value) },
    { key: 'dateCreation', label: 'Créée le', sortable: true, type: 'date' }
  ];

  // Actions pour le tableau
  tableActions: TableAction[] = [
    { label: 'Voir', action: 'view', class: 'btn-info' },
    { label: 'Modifier', action: 'edit', class: 'btn-warning' },
    { label: 'Supprimer', action: 'delete', class: 'btn-danger' }
  ];

  constructor(private reservationService: ReservationHebergementService) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.reservationService.getAll().subscribe({
      next: (data) => {
        this.reservations = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des réservations:', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredReservations = this.reservations.filter(reservation => {
      const matchesStatus = !this.statusFilter || reservation.statut === this.statusFilter;
      const matchesSearch = !this.searchTerm ||
        reservation.nomClient.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        reservation.prenomClient.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        reservation.hebergementNom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        reservation.emailClient.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

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

  saveReservation(): void {
    if (!this.selectedReservation) return;

    this.reservationService.update(this.selectedReservation.id!, this.selectedReservation).subscribe({
      next: (updated) => {
        const index = this.reservations.findIndex(r => r.id === updated.id);
        if (index !== -1) {
          this.reservations[index] = updated;
          this.applyFilters();
        }
        this.closeModal();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
      }
    });
  }

  deleteReservation(reservation: ReservationHebergementDTO): void {
    if (!reservation.id) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer la réservation de ${reservation.nomClient} ${reservation.prenomClient} ?`)) {
      this.reservationService.delete(reservation.id).subscribe({
        next: () => {
          this.reservations = this.reservations.filter(r => r.id !== reservation.id);
          this.applyFilters();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
        }
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedReservation = null;
  }

  getStatusBadgeClass(statut: string): string {
    switch (statut?.toLowerCase()) {
      case 'confirmee':
        return 'badge-success';
      case 'en_attente':
        return 'badge-warning';
      case 'annulee':
        return 'badge-danger';
      case 'terminee':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  getStatusLabel(statut?: string): string {
    if (!statut) return '-';

    const normalized = String(statut).trim().toUpperCase();
    switch (normalized) {
      case 'CONFIRMEE':
        return 'Confirmée';
      case 'EN_ATTENTE':
        return 'En attente';
      case 'ANNULEE':
        return 'Annulée';
      case 'TERMINEE':
        return 'Terminée';
      default:
        // fallback: humanize a bit
        return normalized.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    const trimmed = String(dateString).trim();
    if (!trimmed) return '';

    // Déjà au format dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;

    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR');
  }

  onTableAction(event: { action: string; item: ReservationHebergementDTO }): void {
    switch (event.action) {
      case 'view':
        this.viewReservation(event.item);
        break;
      case 'edit':
        this.editReservation(event.item);
        break;
      case 'delete':
        this.deleteReservation(event.item);
        break;
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }
}