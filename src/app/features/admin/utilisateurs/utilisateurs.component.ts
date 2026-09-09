import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AdminUtilisateursService, UtilisateurDTO } from '../../../services/admin-utilisateurs.service';
import { AuthService } from '../../../services/auth.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AdminActionsBarComponent } from '../../../shared/components/admin-actions-bar/admin-actions-bar.component';
import { BeButtonComponent } from '../../../shared/components/be-button/be-button.component';

const ASSIGNABLE_ROLES = ['USER', 'ADMIN', 'PARTICIPANT'];

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [FormsModule, HeaderComponent, DataTableComponent, ModalComponent, AdminActionsBarComponent, BeButtonComponent],
  templateUrl: './utilisateurs.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./utilisateurs.component.scss']
})
export class UtilisateursComponent implements OnInit {
  readonly assignableRoles = ASSIGNABLE_ROLES;

  utilisateurs: UtilisateurDTO[] = [];
  loading = true;
  loadError = '';
  searchTerm = '';
  sortOption = 'nom-asc';

  showModal = false;
  currentUser: UtilisateurDTO | null = null;
  selectedRole = '';
  formError = '';
  saving = false;
  isSelf = false;

  confirmDeleteOpen = false;
  pendingDeleteId: number | null = null;
  actionError = '';

  currentUserEmail: string | null = null;

  constructor(
    private utilisateursService: AdminUtilisateursService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserEmail = this.authService.getUser()?.email ?? null;
    this.loadUtilisateurs();
  }

  loadUtilisateurs(): void {
    this.loading = true;
    this.loadError = '';

    this.utilisateursService.getAll().subscribe({
      next: (utilisateurs) => {
        this.utilisateurs = utilisateurs;
        this.loading = false;
      },
      error: () => {
        this.utilisateurs = [];
        this.loadError = 'Impossible de charger les utilisateurs pour le moment.';
        this.loading = false;
      }
    });
  }

  tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number', width: '80px' },
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'prenom', label: 'Prénom', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'role', label: 'Rôle', type: 'status' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '220px' }
  ];

  tableActions: TableAction[] = [
    {
      label: 'Modifier le rôle',
      icon: 'ri-shield-user-line',
      class: 'btn-edit',
      action: 'edit',
      condition: (item: UtilisateurDTO) =>
        this.currentUserEmail == null || item.email.toLowerCase() !== this.currentUserEmail.toLowerCase()
    },
    { label: 'Supprimer', icon: 'ri-delete-bin-line', class: 'btn-delete', action: 'delete' }
  ];

  onTableAction(event: { action: string, item: UtilisateurDTO }) {
    const { action, item } = event;
    if (action === 'edit') {
      this.openEditModal(item);
    } else if (action === 'delete') {
      this.deleteUtilisateur(item.id);
    }
  }

  onRowClick(item: UtilisateurDTO) {
    this.openEditModal(item);
  }

  openEditModal(utilisateur: UtilisateurDTO): void {
    this.currentUser = utilisateur;
    this.selectedRole = utilisateur.role;
    this.isSelf = this.currentUserEmail != null && utilisateur.email.toLowerCase() === this.currentUserEmail.toLowerCase();
    this.formError = this.isSelf ? 'Vous ne pouvez pas modifier votre propre rôle.' : '';
    this.saving = false;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentUser = null;
    this.formError = '';
    this.saving = false;
  }

  saveRole(): void {
    if (!this.currentUser || this.isSelf) {
      return;
    }

    this.formError = '';
    this.saving = true;

    this.utilisateursService.updateRole(this.currentUser.id, this.selectedRole).subscribe({
      next: () => {
        this.loadUtilisateurs();
        this.closeModal();
      },
      error: () => {
        this.formError = 'Erreur lors de la modification du rôle.';
        this.saving = false;
      }
    });
  }

  deleteUtilisateur(id: number): void {
    this.pendingDeleteId = id;
    this.confirmDeleteOpen = true;
  }

  executeDelete(): void {
    if (this.pendingDeleteId == null) return;
    const id = this.pendingDeleteId;
    this.confirmDeleteOpen = false;
    this.pendingDeleteId = null;
    this.utilisateursService.delete(id).subscribe({
      next: () => this.loadUtilisateurs(),
      error: () => { this.actionError = 'Impossible de supprimer cet utilisateur.'; }
    });
  }

  get filteredUtilisateurs(): UtilisateurDTO[] {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = !term
      ? [...this.utilisateurs]
      : this.utilisateurs.filter(u =>
          u.nom.toLowerCase().includes(term) ||
          u.prenom.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.role.toLowerCase().includes(term)
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
