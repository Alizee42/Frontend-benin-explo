import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VillesService, VilleDTO } from '../../../services/villes.service';
import { ZonesAdminService, ZoneDTO } from '../../../services/zones-admin.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-villes',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, DataTableComponent, ModalComponent],
  templateUrl: './villes.component.html',
  styleUrls: ['./villes.component.scss']
})
export class VillesComponent implements OnInit {

  villes: VilleDTO[] = [];
  zones: ZoneDTO[] = [];
  loading = true;
  showModal = false;
  isEditing = false;

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
    this.villesService.getAll().subscribe({
      next: (villes) => {
        // Normaliser l'identifiant (fallback si backend renvoie idVille)
        this.villes = villes.map((v: any) => ({
          id: v.id !== undefined ? v.id : v.idVille,
          nom: v.nom,
          zoneId: v.zoneId ?? v.zone?.id ?? null,
          zoneNom: v.zoneNom ?? (v.zone ? v.zone.nom : ''),
          ...v
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement villes', error);
        this.loading = false;
      }
    });
  }

  loadZones(): void {
    this.zonesService.getAll().subscribe({
      next: (zones) => {
        // Normaliser les zones (backend renvoie idZone)
        this.zones = zones.map((z: any) => ({
          id: z.id !== undefined ? z.id : z.idZone,
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
    this.showModal = true;
  }

  openEditModal(ville: VilleDTO): void {
    this.isEditing = true;
    this.currentVille = { ...ville };
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
  }

  saveVille(): void {
    if (this.isEditing) {
      if (this.currentVille.id == null) {
        console.warn('saveVille: id manquant pour modification', this.currentVille);
        return;
      }

      this.villesService.update(this.currentVille.id, this.currentVille).subscribe({
        next: () => {
          this.loadVilles();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur modification ville', error);
        }
      });
    } else {
      this.villesService.create(this.currentVille).subscribe({
        next: () => {
          this.loadVilles();
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur création ville', error);
        }
      });
    }
  }

  deleteVille(id: number): void {
    // Garde: éviter d'appeler l'API si l'id est absent
    if (id == null) {
      console.warn('deleteVille appelé sans id valide', id);
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cette ville ?')) {
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
}