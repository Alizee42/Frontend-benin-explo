import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationsCircuitService, ReservationCircuitDTO } from '../../../services/reservations-circuit.service';
import { DataTableComponent, TableAction, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { AdminActionsBarComponent } from '../../../shared/components/admin-actions-bar/admin-actions-bar.component';
import { BeButtonComponent } from '../../../shared/components/be-button/be-button.component';

@Component({
  selector: 'app-reservations-circuit-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ModalComponent, HeaderComponent, AdminActionsBarComponent, BeButtonComponent],
  templateUrl: './reservations-circuit-admin.component.html',
  styleUrls: ['./reservations-circuit-admin.component.scss']
})
export class ReservationsCircuitAdminComponent implements OnInit {
  reservations: ReservationCircuitDTO[] = [];
  filteredReservations: ReservationCircuitDTO[] = [];
  loading = true;
  saving = false;
  showModal = false;
  confirmDeleteOpen = false;
  pendingDeleteId: number | null = null;
  selectedReservation: ReservationCircuitDTO | null = null;
  statusFilter = '';
  searchTerm = '';
  successMessage = '';
  errorMessage = '';

  columns: TableColumn[] = [
    { key: 'nom', label: 'Client', sortable: true, valueGetter: (item: any) => `${item.prenom || ''} ${item.nom || ''}`.trim() },
    { key: 'telephone', label: 'Téléphone', sortable: true },
    { key: 'circuitNom', label: 'Circuit', sortable: true },
    { key: 'dateReservation', label: 'Date', sortable: true, type: 'date' },
    { key: 'nombrePersonnes', label: 'Pers.', sortable: true, width: '70px' },
    { key: 'statut', label: 'Statut', sortable: true, type: 'status', formatter: (v: string) => this.getStatusLabel(v) },
    { key: 'actions', label: 'Actions', type: 'actions' }
  ];

  tableActions: TableAction[] = [
    { label: 'Voir', icon: 'ri-eye-line', action: 'view', class: 'btn-info' },
    { label: 'Supprimer', icon: 'ri-delete-bin-6-line', action: 'delete', class: 'btn-danger' }
  ];

  constructor(private service: ReservationsCircuitService) {}

  ngOnInit(): void { this.loadReservations(); }

  loadReservations(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.reservations = data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les réservations.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const term = (this.searchTerm || '').trim().toLowerCase();
    this.filteredReservations = this.reservations.filter(r => {
      const matchesStatus = !this.statusFilter || (r.statut || 'EN_ATTENTE').toUpperCase() === this.statusFilter;
      const matchesSearch = !term
        || (r.nom || '').toLowerCase().includes(term)
        || (r.prenom || '').toLowerCase().includes(term)
        || (r.circuitNom || '').toLowerCase().includes(term)
        || (r.email || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }

  onTableAction(event: { action: string; item: ReservationCircuitDTO }): void {
    if (event.action === 'view') this.viewReservation(event.item);
    if (event.action === 'delete') { this.pendingDeleteId = event.item.id!; this.confirmDeleteOpen = true; }
  }

  viewReservation(r: ReservationCircuitDTO): void {
    this.selectedReservation = { ...r };
    this.showModal = true;
  }

  quickSetStatus(statut: string): void {
    if (!this.selectedReservation) return;
    this.selectedReservation.statut = statut;
    this.saveReservation();
  }

  saveReservation(): void {
    if (!this.selectedReservation?.id) return;
    this.saving = true;
    this.service.update(this.selectedReservation.id, this.selectedReservation).subscribe({
      next: (updated) => {
        const idx = this.reservations.findIndex(r => r.id === updated.id);
        if (idx !== -1) this.reservations[idx] = updated;
        this.applyFilters();
        this.saving = false;
        this.successMessage = 'Réservation mise à jour.';
        this.showModal = false;
      },
      error: () => { this.saving = false; this.errorMessage = 'Échec de la mise à jour.'; }
    });
  }

  executeDelete(): void {
    if (this.pendingDeleteId == null) return;
    const id = this.pendingDeleteId;
    this.confirmDeleteOpen = false;
    this.pendingDeleteId = null;
    this.service.delete(id).subscribe({
      next: () => {
        this.reservations = this.reservations.filter(r => r.id !== id);
        this.applyFilters();
        this.successMessage = 'Réservation supprimée.';
      },
      error: () => { this.errorMessage = 'Suppression impossible.'; }
    });
  }

  countByStatus(statut: string): number {
    return this.reservations.filter(r => (r.statut || 'EN_ATTENTE').toUpperCase() === statut).length;
  }

  getStatusLabel(statut?: string): string {
    const s = (statut || 'EN_ATTENTE').toUpperCase();
    if (s === 'CONFIRMEE') return 'Confirmée';
    if (s === 'EN_ATTENTE') return 'En attente';
    if (s === 'ANNULEE') return 'Annulée';
    if (s === 'TERMINEE') return 'Terminée';
    return s;
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

  getStatusIcon(statut?: string): string {
    switch ((statut || 'EN_ATTENTE').toUpperCase()) {
      case 'CONFIRMEE': return 'ri-checkbox-circle-fill';
      case 'EN_ATTENTE': return 'ri-time-fill';
      case 'ANNULEE': return 'ri-close-circle-fill';
      case 'TERMINEE': return 'ri-flag-fill';
      default: return 'ri-question-fill';
    }
  }

  formatDate(d?: string): string {
    if (!d) return '';
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR');
  }
}
