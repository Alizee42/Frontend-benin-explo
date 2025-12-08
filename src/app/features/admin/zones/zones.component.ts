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

  currentZone: ZoneDTO = {
    id: 0,
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
      this.deleteZone(item?.id);
    }
  }

  onRowClick(item: any) {
    this.openEditModal(item);
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentZone = {
      id: 0,
      nom: '',
      description: ''
    };
    this.showModal = true;
  }

  openEditModal(zone: ZoneDTO): void {
    this.isEditing = true;
    this.currentZone = { ...zone };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveZone(): void {
    if (this.isEditing) {
      this.zonesService.update(this.currentZone.id, this.currentZone).subscribe({
        next: () => {
          this.loadZones();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur modification zone', error);
        }
      });
    } else {
      this.zonesService.create(this.currentZone).subscribe({
        next: () => {
          this.loadZones();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur création zone', error);
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
}