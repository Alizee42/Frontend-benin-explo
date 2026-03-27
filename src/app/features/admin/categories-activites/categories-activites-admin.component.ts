import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriesActivitesService, CategorieActivite } from '../../../services/categories-activites.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AdminActionsBarComponent } from '../../../shared/components/admin-actions-bar/admin-actions-bar.component';
import { BeButtonComponent } from '../../../shared/components/be-button/be-button.component';

@Component({
  selector: 'app-categories-activites-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, DataTableComponent, ModalComponent, AdminActionsBarComponent, BeButtonComponent],
  templateUrl: './categories-activites-admin.component.html'
})
export class CategoriesActivitesAdminComponent implements OnInit {
  confirmDeleteOpen = false;
  pendingDeleteId: number | null = null;
  error = '';

  categories: CategorieActivite[] = [];
  loading = true;
  loadError = '';
  showModal = false;
  isEditing = false;
  saving = false;
  searchTerm = '';
  formError = '';
  sortOption = 'nom-asc';

  current: { id?: number; nom: string; description: string } = { nom: '', description: '' };

  constructor(private service: CategoriesActivitesService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    this.service.getAll().subscribe({
      next: (data) => { this.categories = data; this.loading = false; },
      error: () => { this.loadError = 'Impossible de charger les catégories.'; this.loading = false; }
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

  onTableAction(event: { action: string; item: CategorieActivite }) {
    if (event.action === 'edit') this.openEditModal(event.item);
    if (event.action === 'delete') { this.pendingDeleteId = event.item.id; this.confirmDeleteOpen = true; }
  }

  onRowClick(item: CategorieActivite) { this.openEditModal(item); }

  openAddModal(): void {
    this.isEditing = false;
    this.current = { nom: '', description: '' };
    this.formError = '';
    this.saving = false;
    this.showModal = true;
  }

  openEditModal(cat: CategorieActivite): void {
    this.isEditing = true;
    this.current = { id: cat.id, nom: cat.nom, description: cat.description ?? '' };
    this.formError = '';
    this.saving = false;
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.formError = ''; this.saving = false; }

  save(): void {
    const nom = this.current.nom.trim();
    if (!nom) { this.formError = 'Le nom est obligatoire'; return; }

    this.formError = '';
    this.saving = true;
    const payload = { nom, description: this.current.description.trim() };

    if (this.isEditing && this.current.id != null) {
      this.service.update(this.current.id, payload).subscribe({
        next: () => { this.load(); this.closeModal(); },
        error: () => { this.formError = 'Erreur lors de la modification'; this.saving = false; }
      });
    } else {
      this.service.create(payload).subscribe({
        next: () => { this.load(); this.closeModal(); },
        error: () => { this.formError = 'Erreur lors de la création'; this.saving = false; }
      });
    }
  }

  executeDelete(): void {
    if (this.pendingDeleteId == null) return;
    const id = this.pendingDeleteId;
    this.confirmDeleteOpen = false;
    this.pendingDeleteId = null;
    this.service.delete(id).subscribe({
      next: () => this.load(),
      error: () => { this.error = 'Impossible de supprimer cette catégorie.'; }
    });
  }

  get filtered(): CategorieActivite[] {
    const term = this.searchTerm.trim().toLowerCase();
    const list = !term
      ? [...this.categories]
      : this.categories.filter(c =>
          c.nom.toLowerCase().includes(term) ||
          (c.description || '').toLowerCase().includes(term)
        );

    const [key, dir] = this.sortOption.split('-');
    list.sort((a, b) => {
      const av = key === 'nom' ? a.nom.toLowerCase() : a.id;
      const bv = key === 'nom' ? b.nom.toLowerCase() : b.id;
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }
}
