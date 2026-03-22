import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZonesAdminService, ZoneDTO } from '../../../services/zones-admin.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AdminActionsBarComponent } from '../../../shared/components/admin-actions-bar/admin-actions-bar.component';
import { BeButtonComponent } from '../../../shared/components/be-button/be-button.component';

type ZoneRow = ZoneDTO & { id: number };

@Component({
  selector: 'app-zones',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, DataTableComponent, ModalComponent, AdminActionsBarComponent, BeButtonComponent],
  templateUrl: './zones.component.html',
  styleUrls: ['./zones.component.scss']
})
export class ZonesComponent implements OnInit {
  confirmDeleteOpen = false;
  pendingDeleteId: number | null = null;
  error = '';


  zones: ZoneRow[] = [];
  loading = true;
  loadError = '';
  showModal = false;
  isEditing = false;
  saving = false;
  searchTerm = '';
  formError = '';
  sortOption = 'nom-asc';

  currentZone: ZoneDTO = {
    nom: '',
    description: ''
  };

  constructor(private zonesService: ZonesAdminService) {}

  ngOnInit(): void {
    this.loadZones();
  }

  loadZones(): void {
    this.loading = true;
    this.loadError = '';

    this.zonesService.getAll().subscribe({
      next: (zones) => {
        this.zones = zones.map((z) => ({
          ...z,
          id: z.idZone ?? 0,
          description: z.description ?? ''
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement zones', error);
        this.zones = [];
        this.loadError = 'Impossible de charger les zones pour le moment.';
        this.loading = false;
      }
    });
  }

  tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number', width: '80px' },
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '220px' }
  ];

  tableActions: TableAction[] = [
    { label: 'Modifier', icon: 'ri-edit-line', class: 'btn-edit', action: 'edit' },
    { label: 'Supprimer', icon: 'ri-delete-bin-line', class: 'btn-delete', action: 'delete' }
  ];

  onTableAction(event: { action: string, item: ZoneRow }) {
    const { action, item } = event;
    if (action === 'edit') {
      this.openEditModal(item);
    } else if (action === 'delete') {
      this.deleteZone(item.idZone);
    }
  }

  onRowClick(item: ZoneRow) {
    this.openEditModal(item);
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentZone = {
      nom: '',
      description: ''
    };
    this.formError = '';
    this.saving = false;
    this.showModal = true;
  }

  openEditModal(zone: ZoneDTO): void {
    this.isEditing = true;
    this.currentZone = {
      idZone: zone.idZone,
      nom: zone.nom,
      description: zone.description ?? ''
    };
    this.formError = '';
    this.saving = false;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = '';
    this.saving = false;
  }

  saveZone(): void {
    const nom = (this.currentZone.nom || '').trim();
    const description = (this.currentZone.description || '').trim();

    if (!nom) {
      this.formError = 'Le nom est obligatoire';
      return;
    }

    this.formError = '';
    this.saving = true;

    const payload: ZoneDTO = {
      nom,
      description
    };

    if (this.isEditing && this.currentZone.idZone != null) {
      this.zonesService.update(this.currentZone.idZone, payload).subscribe({
        next: () => {
          this.loadZones();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur modification zone', error);
          this.formError = 'Erreur lors de la modification de la zone';
          this.saving = false;
        }
      });
    } else {
      this.zonesService.create(payload).subscribe({
        next: () => {
          this.loadZones();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur création zone', error);
          this.formError = 'Erreur lors de la création de la zone';
          this.saving = false;
        }
      });
    }
  }

  executeDelete(): void {
    if (this.pendingDeleteId == null) return;
    const id = this.pendingDeleteId;
    this.confirmDeleteOpen = false;
    this.pendingDeleteId = null;
    this.zonesService.delete(id).subscribe({
      next: () => this.loadZones(),
      error: () => { this.error = 'Impossible de supprimer cette zone.'; }
    });
  }

  deleteZone(id?: number): void {
    if (id == null) {
      console.warn('deleteZone appelé sans id valide', id);
      return;
    }

    this.pendingDeleteId = id;
    this.confirmDeleteOpen = true;
  }

  get filteredZones(): ZoneRow[] {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = !term
      ? [...this.zones]
      : this.zones.filter(z =>
          (z.nom || '').toLowerCase().includes(term) ||
          (z.description || '').toLowerCase().includes(term)
        );

    const [key, dir] = this.sortOption.split('-');
    filtered.sort((a, b) => {
      const av = key === 'nom' ? a.nom.toLowerCase() : a.id;
      const bv = key === 'nom' ? b.nom.toLowerCase() : b.id;

      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }
}
