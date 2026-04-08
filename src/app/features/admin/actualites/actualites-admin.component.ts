import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActualiteDTO, ActualitesService } from '../../../services/actualites.service';
import { MediaService } from '../../../services/media.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent, TableAction, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AdminActionsBarComponent } from '../../../shared/components/admin-actions-bar/admin-actions-bar.component';
import { BeButtonComponent } from '../../../shared/components/be-button/be-button.component';

type ActualiteFormModel = ActualiteDTO & {
  imagePreview?: string | null;
};

@Component({
  selector: 'app-actualites-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    DataTableComponent,
    ModalComponent,
    AdminActionsBarComponent,
    BeButtonComponent
  ],
  templateUrl: './actualites-admin.component.html',
  styleUrls: ['./actualites-admin.component.scss']
})
export class ActualitesAdminComponent implements OnInit {
  actualites: ActualiteDTO[] = [];
  loading = true;
  loadError = '';
  showModal = false;
  confirmDeleteOpen = false;
  pendingDeleteId: number | null = null;
  isEditing = false;
  saving = false;
  searchTerm = '';
  sortOption = 'date-desc';
  formError = '';
  successMessage = '';
  uploadError = '';
  uploading = false;

  current: ActualiteFormModel = this.createEmptyActualite();

  tableColumns: TableColumn[] = [
    { key: 'imageUrl', label: 'Image', type: 'image', width: '80px' },
    { key: 'titre', label: 'Titre', sortable: true },
    { key: 'datePublication', label: 'Publication', type: 'date', sortable: true, width: '140px' },
    { key: 'publiee', label: 'Visibilite', sortable: true, valueGetter: (item: ActualiteDTO) => item.publiee ? 'Publiee' : 'Brouillon', width: '120px' },
    { key: 'aLaUne', label: 'Home', sortable: true, valueGetter: (item: ActualiteDTO) => item.aLaUne ? 'A la une' : 'Standard', width: '110px' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '100px' }
  ];

  tableActions: TableAction[] = [
    { label: 'Modifier', icon: 'ri-edit-2-line', action: 'edit', class: 'btn-warning' },
    { label: 'Supprimer', icon: 'ri-delete-bin-6-line', action: 'delete', class: 'btn-danger' }
  ];

  constructor(
    private actualitesService: ActualitesService,
    private mediaService: MediaService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get filteredActualites(): ActualiteDTO[] {
    const term = this.searchTerm.trim().toLowerCase();
    const list = !term
      ? [...this.actualites]
      : this.actualites.filter((item) =>
          (item.titre || '').toLowerCase().includes(term)
          || (item.resume || '').toLowerCase().includes(term)
          || (item.contenu || '').toLowerCase().includes(term)
          || (item.auteurNom || '').toLowerCase().includes(term)
        );

    const [key, direction] = this.sortOption.split('-');
    list.sort((a, b) => {
      if (key === 'titre') {
        const av = (a.titre || '').toLowerCase();
        const bv = (b.titre || '').toLowerCase();
        return direction === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }

      const av = new Date(a.datePublication || 0).getTime();
      const bv = new Date(b.datePublication || 0).getTime();
      return direction === 'asc' ? av - bv : bv - av;
    });

    return list;
  }

  load(): void {
    this.loading = true;
    this.loadError = '';

    this.actualitesService.getAllAdmin().subscribe({
      next: (items) => {
        this.actualites = items || [];
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Impossible de charger les actualites pour le moment.';
        this.loading = false;
      }
    });
  }

  onTableAction(event: { action: string; item: ActualiteDTO }): void {
    if (event.action === 'edit') {
      this.openEditModal(event.item);
    }
    if (event.action === 'delete' && event.item.id != null) {
      this.pendingDeleteId = event.item.id;
      this.confirmDeleteOpen = true;
    }
  }

  onRowClick(item: ActualiteDTO): void {
    this.openEditModal(item);
  }

  openAddModal(): void {
    this.isEditing = false;
    this.current = this.createEmptyActualite();
    this.formError = '';
    this.successMessage = '';
    this.uploadError = '';
    this.uploading = false;
    this.showModal = true;
  }

  openEditModal(item: ActualiteDTO): void {
    this.isEditing = true;
    this.current = {
      id: item.id,
      titre: item.titre,
      resume: item.resume || '',
      contenu: item.contenu,
      datePublication: this.formatDateForInput(item.datePublication),
      aLaUne: item.aLaUne === true,
      publiee: item.publiee !== false,
      imagePrincipaleId: item.imagePrincipaleId ?? null,
      imageUrl: item.imageUrl || null,
      auteurId: item.auteurId ?? null,
      auteurNom: item.auteurNom || null,
      imagePreview: item.imageUrl || null
    };
    this.formError = '';
    this.successMessage = '';
    this.uploadError = '';
    this.uploading = false;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
    this.uploading = false;
    this.uploadError = '';
    this.formError = '';
  }

  save(): void {
    const titre = this.current.titre.trim();
    const contenu = this.current.contenu.trim();

    if (!titre || !contenu) {
      this.formError = 'Le titre et le contenu sont obligatoires.';
      return;
    }

    this.formError = '';
    this.saving = true;

    const payload: ActualiteDTO = {
      titre,
      contenu,
      resume: (this.current.resume || '').trim() || null,
      datePublication: this.current.datePublication || null,
      aLaUne: this.current.aLaUne === true,
      publiee: this.current.publiee !== false,
      imagePrincipaleId: this.current.imagePrincipaleId ?? null,
      imageUrl: this.current.imageUrl ?? null,
      auteurId: this.current.auteurId ?? null
    };

    const request$ = this.isEditing && this.current.id != null
      ? this.actualitesService.update(this.current.id, payload)
      : this.actualitesService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = this.isEditing
          ? 'Actualite mise a jour.'
          : 'Actualite creee.';
        this.closeModal();
        this.load();
      },
      error: () => {
        this.saving = false;
        this.formError = this.isEditing
          ? 'Impossible de modifier cette actualite.'
          : 'Impossible de creer cette actualite.';
      }
    });
  }

  executeDelete(): void {
    if (this.pendingDeleteId == null) {
      return;
    }

    const id = this.pendingDeleteId;
    this.confirmDeleteOpen = false;
    this.pendingDeleteId = null;

    this.actualitesService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Actualite supprimee.';
        this.load();
      },
      error: () => {
        this.loadError = 'Impossible de supprimer cette actualite.';
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.uploading = true;
    this.uploadError = '';

    this.mediaService.uploadImage(file).subscribe({
      next: (media) => {
        this.current.imagePrincipaleId = media.id;
        this.current.imageUrl = media.url;
        this.current.imagePreview = this.actualitesService.resolveImage(media.url);
        this.uploading = false;
      },
      error: () => {
        this.uploading = false;
        this.uploadError = 'Impossible d envoyer cette image pour le moment.';
      }
    });
  }

  removeImage(): void {
    this.current.imagePrincipaleId = null;
    this.current.imageUrl = null;
    this.current.imagePreview = null;
  }

  private createEmptyActualite(): ActualiteFormModel {
    return {
      titre: '',
      resume: '',
      contenu: '',
      datePublication: '',
      aLaUne: false,
      publiee: true,
      imagePrincipaleId: null,
      imageUrl: null,
      auteurId: null,
      auteurNom: null,
      imagePreview: null
    };
  }

  private formatDateForInput(value?: string | null): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value.slice(0, 16);
    }

    const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
}
