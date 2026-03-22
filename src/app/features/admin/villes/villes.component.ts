import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VillesService, VilleDTO } from '../../../services/villes.service';
import { ZonesAdminService, ZoneDTO } from '../../../services/zones-admin.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AdminActionsBarComponent } from '../../../shared/components/admin-actions-bar/admin-actions-bar.component';
import { BeButtonComponent } from '../../../shared/components/be-button/be-button.component';

@Component({
  selector: 'app-villes',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, DataTableComponent, ModalComponent, AdminActionsBarComponent, BeButtonComponent],
  templateUrl: './villes.component.html',
  styleUrls: ['./villes.component.scss']
})
export class VillesComponent implements OnInit {
  confirmDeleteOpen = false;
  pendingDeleteId: number | null = null;


  villes: VilleDTO[] = [];
  zones: ZoneDTO[] = [];
  loading = true;
  loadError = '';
  showModal = false;
  isEditing = false;
  saving = false;
  searchTerm = '';
  sortOption = 'nom-asc';
  formError = '';

  currentVille: VilleDTO = {
    id: 0,
    nom: '',
    zoneId: null,
    zoneNom: ''
  };

  constructor(
    private villesService: VillesService,
    private zonesService: ZonesAdminService
  ) {}

  ngOnInit(): void {
    this.loadVilles();
    this.loadZones();
  }

  loadVilles(): void {
    this.loading = true;
    this.loadError = '';

    this.villesService.getAll().subscribe({
      next: (villes) => {
        this.villes = villes.map((v: any) => ({
          ...v,
          id: v.id !== undefined ? v.id : v.idVille,
          nom: v.nom,
          zoneId: v.zoneId ?? v.zone?.idZone ?? v.zone?.id ?? null,
          zoneNom: v.zoneNom ?? (v.zone ? v.zone.nom : ''),
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement villes', error);
        this.villes = [];
        this.loadError = 'Impossible de charger les villes pour le moment.';
        this.loading = false;
      }
    });
  }

  loadZones(): void {
    this.zonesService.getAll().subscribe({
      next: (zones) => {
        this.zones = zones.map((z: any) => ({
          id: z.id !== undefined ? z.id : z.idZone,
          idZone: z.idZone ?? z.id,
          nom: z.nom,
          description: z.description,
          ...z
        }));
      },
      error: (error) => {
        console.error('Erreur chargement zones', error);
      }
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentVille = {
      id: 0,
      nom: '',
      zoneId: null,
      zoneNom: ''
    };
    this.formError = '';
    this.saving = false;
    this.showModal = true;
  }

  openEditModal(ville: VilleDTO): void {
    this.isEditing = true;
    this.currentVille = { ...ville };
    this.formError = '';
    this.saving = false;
    this.showModal = true;
  }

  // Configuration du tableau réutilisable
  tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number', width: '80px' },
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'zoneNom', label: 'Zone', type: 'text', width: '160px' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '220px' }
  ];

  tableActions: TableAction[] = [
    { label: 'Modifier', icon: 'ri-edit-line', class: 'btn-edit', action: 'edit' },
    { label: 'Supprimer', icon: 'ri-delete-bin-line', class: 'btn-delete', action: 'delete' }
  ];

  onTableAction(event: { action: string, item: any }) {
    const { action, item } = event;
    if (action === 'edit') {
      this.openEditModal(item);
    } else if (action === 'delete') {
      this.deleteVille(item?.id);
    }
  }

  onRowClick(item: any) {
    this.openEditModal(item);
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = '';
    this.saving = false;
  }

  saveVille(): void {
    const nom = (this.currentVille.nom || '').trim();

    if (!nom) {
      this.formError = 'Le nom est obligatoire';
      return;
    }

    if (this.currentVille.zoneId == null) {
      this.formError = 'La zone est obligatoire';
      return;
    }

    this.formError = '';
    this.saving = true;

    const payload: VilleDTO = {
      id: this.currentVille.id,
      nom,
      zoneId: Number(this.currentVille.zoneId),
      zoneNom: this.currentVille.zoneNom || ''
    };

    if (this.isEditing) {
      if (payload.id == null) {
        console.warn('saveVille: id manquant pour modification', this.currentVille);
        this.saving = false;
        return;
      }

      this.villesService.update(payload.id, payload).subscribe({
        next: () => {
          this.loadVilles();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur modification ville', error);
          this.formError = 'Erreur lors de la modification de la ville';
          this.saving = false;
        }
      });
    } else {
      this.villesService.create(payload).subscribe({
        next: () => {
          this.loadVilles();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur création ville', error);
          this.formError = 'Erreur lors de la création de la ville';
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
    this.villesService.delete(id).subscribe({
      next: () => this.loadVilles(),
      error: () => { this.error = 'Impossible de supprimer cette ville.'; }
    });
  }

  deleteVille(id: number): void {
    // Garde: éviter d'appeler l'API si l'id est absent
    if (id == null) {
      console.warn('deleteVille appelé sans id valide', id);
      return;
    }

    this.pendingDeleteId = id;
    this.confirmDeleteOpen = true;
    if (false) {
      this.villesService.delete(id).subscribe({
        next: () => {
          this.loadVilles();
        },
        error: (error) => {
          console.error('Erreur suppression ville', error);
        }
      });
    }
  }

  get filteredVilles(): VilleDTO[] {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = !term
      ? [...this.villes]
      : this.villes.filter(v =>
          (v.nom || '').toLowerCase().includes(term) ||
          (v.zoneNom || '').toLowerCase().includes(term)
        );

    const [key, dir] = this.sortOption.split('-');
    filtered.sort((a, b) => {
      const av = key === 'zone'
        ? (a.zoneNom || '').toLowerCase()
        : key === 'id'
          ? a.id
          : (a.nom || '').toLowerCase();
      const bv = key === 'zone'
        ? (b.zoneNom || '').toLowerCase()
        : key === 'id'
          ? b.id
          : (b.nom || '').toLowerCase();

      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }
}
