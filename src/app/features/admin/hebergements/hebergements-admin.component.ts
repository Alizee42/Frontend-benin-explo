import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HebergementsService, HebergementDTO } from '../../../services/hebergements.service';
import { VillesService, VilleDTO } from '../../../services/villes.service';
import { MediaService, MediaDTO } from '../../../services/media.service';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  standalone: true,
  selector: 'app-hebergements-admin',
  imports: [CommonModule, RouterModule, FormsModule, DataTableComponent, ModalComponent, HeaderComponent],
  templateUrl: './hebergements-admin.component.html',
  styleUrls: ['./hebergements-admin.component.scss']
})
export class HebergementsAdminComponent implements OnInit {
  hebergements: HebergementDTO[] = [];
  loading = true;

  // villes pour la localisation
  villes: VilleDTO[] = [];
  selectedVilleId: number | null = null;

  // modal / form state
  showModal = false;
  isEditing = false;
  currentHebergement: Partial<HebergementDTO> = { id: 0, nom: '', type: '', localisation: '', description: '', prixParNuit: 0 };

  // image upload
  selectedImages: { file: File; preview: string }[] = [];

  tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number', width: '80px' },
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'type', label: 'Type', type: 'text', width: '120px' },
    { key: 'localisation', label: 'Localisation', type: 'text', width: '200px' },
    { key: 'prixParNuit', label: 'Prix/nuit (€)', type: 'number', width: '120px' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '220px' }
  ];

  tableActions: TableAction[] = [
    { label: 'Éditer', icon: 'ri-edit-line', class: 'btn-edit', action: 'edit' },
    { label: 'Supprimer', icon: 'ri-delete-bin-line', class: 'btn-delete', action: 'delete' }
  ];

  constructor(
    private hebergementsService: HebergementsService,
    private villesService: VillesService,
    private mediaService: MediaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHebergements();
    this.loadVilles();
  }

  loadHebergements(): void {
    this.loading = true;
    this.hebergementsService.getAll().subscribe({
      next: (data) => {
        this.hebergements = data;
        this.loading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement hébergements', err);
        this.loading = false;
      }
    });
  }

  loadVilles(): void {
    this.villesService.getAll().subscribe({
      next: (data) => {
        this.villes = data;
      },
      error: (err) => {
        console.error('Erreur chargement villes', err);
      }
    });
  }

  onTableAction(event: { action: string; item: any }): void {
    const { action, item } = event;
    if (action === 'edit') this.openEditModal(item);
    if (action === 'delete') this.deleteHebergement(item.id);
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentHebergement = { id: 0, nom: '', type: '', localisation: '', quartier: '', description: '', prixParNuit: 0 };
    this.selectedVilleId = null;
    this.selectedImages = [];
    this.showModal = true;
  }

  openEditModal(heb: HebergementDTO): void {
    this.isEditing = true;
    this.currentHebergement = { ...heb };
    this.selectedVilleId = this.findVilleIdByName(heb.localisation);
    // extraire le quartier de la localisation si présent
    if (heb.localisation && heb.localisation.includes(', ')) {
      const parts = heb.localisation.split(', ');
      this.currentHebergement.quartier = parts[1];
    } else {
      this.currentHebergement.quartier = '';
    }
    this.selectedImages = [];
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  private findVilleIdByName(nom: string | undefined): number | null {
    if (!nom) return null;
    const ville = this.villes.find(v => v.nom === nom);
    return ville ? ville.id : null;
  }

  saveHebergement(): void {
    // affecter la localisation à partir de la ville sélectionnée
    if (this.selectedVilleId) {
      const ville = this.villes.find(v => v.id === this.selectedVilleId);
      if (ville) {
        let localisation = ville.nom;
        if (this.currentHebergement.quartier && this.currentHebergement.quartier.trim()) {
          localisation += `, ${this.currentHebergement.quartier.trim()}`;
        }
        this.currentHebergement.localisation = localisation;
      }
    }

    // s'assurer que quartier est défini
    if (!this.currentHebergement.quartier) {
      this.currentHebergement.quartier = '';
    }

    // Upload images first, then save hebergement
    if (this.selectedImages.length > 0) {
      const uploadPromises = this.selectedImages.map(image =>
        this.mediaService.uploadImage(image.file).toPromise()
      );

      Promise.all(uploadPromises).then(medias => {
        this.currentHebergement.imageUrls = medias.filter((m): m is MediaDTO => m !== null && m !== undefined).map(m => m.url);
        this.saveHebergementWithMedias();
      }).catch(err => {
        console.error('Erreur upload images', err);
        // Continue without images if upload fails
        this.currentHebergement.imageUrls = [];
        this.saveHebergementWithMedias();
      });
    } else {
      this.currentHebergement.imageUrls = [];
      console.log('[HebergementsAdminComponent] Création/édition sans images, payload avant saveHebergementWithMedias =', this.currentHebergement);
      this.saveHebergementWithMedias();
    }
  }

  private saveHebergementWithMedias(): void {
    console.log('[HebergementsAdminComponent] saveHebergementWithMedias() appelé, isEditing=', this.isEditing, 'payload=', this.currentHebergement);

    if (this.isEditing && this.currentHebergement.id) {
      this.hebergementsService.update(this.currentHebergement.id, this.currentHebergement as Omit<HebergementDTO, 'id'>).subscribe({
        next: (updated) => {
          const index = this.hebergements.findIndex(h => h.id === updated.id);
          if (index >= 0) {
            this.hebergements[index] = updated;
            this.hebergements = [...this.hebergements];
          }
          this.selectedImages = [];
          this.closeModal();
        },
        error: (err) => console.error('Erreur update hébergement', err)
      });
    } else {
      console.log('[HebergementsAdminComponent] Appel create() avec payload =', this.currentHebergement);
      this.hebergementsService.create(this.currentHebergement as Omit<HebergementDTO, 'id'>).subscribe({
        next: (created) => {
          console.log('[HebergementsAdminComponent] Réponse création hébergement =', created);
          this.hebergements = [...this.hebergements, created];
          this.selectedImages = [];
          this.closeModal();
        },
        error: (err) => console.error('Erreur création hébergement', err)
      });
    }
  }

  deleteHebergement(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet hébergement ?')) {
      this.hebergementsService.delete(id).subscribe({
        next: () => {
          this.hebergements = this.hebergements.filter(h => h.id !== id);
        },
        error: (err) => console.error('Erreur suppression hébergement', err)
      });
    }
  }

  // Image upload methods
  triggerImageUpload(): void {
    const input = document.getElementById('imageUpload') as HTMLInputElement;
    input?.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.selectedImages.push({
              file: file,
              preview: e.target?.result as string
            });
            this.cdr.detectChanges();
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
  }
}