import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZonesAdminService, ZoneDTO } from '../../../services/zones-admin.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-zones',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, DataTableComponent, ModalComponent],
  templateUrl: './zones.component.html',
  styleUrls: ['./zones.component.scss']
})
export class ZonesComponent implements OnInit {

  zones: ZoneDTO[] = [];
  loading = true;
  showModal = false;
  isEditing = false;
  saving = false;
  searchTerm = '';
  formError = '';
  sortOption = 'nom-asc';

  currentZone: ZoneDTO = {
    idZone: 0,
    nom: '',
    description: ''
  };

  constructor(private zonesService: ZonesAdminService) {}

  ngOnInit(): void {
    this.loadZones();
  }

  loadZones(): void {
    this.zonesService.getAll().subscribe({
      next: (zones) => {
        // Normaliser le champ d'identifiant : backend renvoie parfois `idZone`
        this.zones = zones.map((z: any) => ({
          id: z.id !== undefined ? z.id : z.idZone,
          nom: z.nom,
          description: z.description,
          ...z
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement zones', error);
        this.loading = false;
      }
    });
  }

  // Configuration du tableau réutilisable
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

  onTableAction(event: { action: string, item: any }) {
    const { action, item } = event;
    if (action === 'edit') {
      this.openEditModal(item);
    } else if (action === 'delete') {
      const id = item?.idZone ?? item?.id;
      this.deleteZone(id);
    }
  }

  onRowClick(item: any) {
    this.openEditModal(item);
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentZone = {
      idZone: 0,
      nom: '',
      description: ''
    };
    this.formError = '';
    this.showModal = true;
  }

  openEditModal(zone: ZoneDTO): void {
    this.isEditing = true;
    this.currentZone = { ...zone, idZone: (zone as any).idZone ?? (zone as any).id ?? zone.idZone };
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
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
      ...this.currentZone,
      nom,
      description
    };

    if (this.isEditing) {
      const id = this.currentZone.idZone || (this.currentZone as any).id;
      this.zonesService.update(id, payload).subscribe({
        next: () => {
          this.loadZones();
          this.closeModal();
          this.saving = false;
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
          this.saving = false;
        },
        error: (error) => {
          console.error('Erreur création zone', error);
          this.formError = 'Erreur lors de la création de la zone';
          this.saving = false;
        }
      });
    }
  }

  deleteZone(id: number): void {
    // Garde: éviter d'appeler l'API si l'id est absent
    if (id == null) {
      console.warn('deleteZone appelé sans id valide', id);
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) {
      this.zonesService.delete(id).subscribe({
        next: () => {
          this.loadZones();
        },
        error: (error) => {
          console.error('Erreur suppression zone', error);
        }
      });
    }
  }

  get filteredZones(): ZoneDTO[] {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = !term
      ? [...this.zones]
      : this.zones.filter(z =>
      (z.nom || '').toLowerCase().includes(term) ||
      (z.description || '').toLowerCase().includes(term)
    );

    const [key, dir] = this.sortOption.split('-');
    filtered.sort((a: any, b: any) => {
      const av = key === 'nom' ? (a.nom || '').toLowerCase() : (a.id ?? a.idZone ?? 0);
      const bv = key === 'nom' ? (b.nom || '').toLowerCase() : (b.id ?? b.idZone ?? 0);

      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }
}
