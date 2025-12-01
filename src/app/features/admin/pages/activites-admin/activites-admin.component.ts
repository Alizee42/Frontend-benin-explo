import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';
import { AuthService } from '../../../../services/auth.service';
import { ActivitesService, Activite } from '../../../../services/activites.service';

@Component({
  selector: 'app-activites-admin',
  standalone: true,
  imports: [CommonModule, HeaderComponent, DataTableComponent],
  templateUrl: './activites-admin.component.html',
  styleUrls: ['./activites-admin.component.scss']
})
export class ActivitesAdminComponent implements OnInit {
  activites: Activite[] = [];
  loading = true;

  // Configuration du tableau
  tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number', width: '80px' },
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'prix', label: 'Prix (€)', type: 'number', width: '100px' },
    { key: 'duree', label: 'Durée', type: 'text', width: '100px' },
    { key: 'type', label: 'Type', type: 'text', width: '120px' },
    { key: 'zone', label: 'Zone', type: 'text' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '150px' }
  ];

  tableActions: TableAction[] = [
    {
      label: 'Modifier',
      icon: 'ri-edit-line',
      class: 'btn-edit',
      action: 'edit'
    },
    {
      label: 'Supprimer',
      icon: 'ri-delete-bin-line',
      class: 'btn-delete',
      action: 'delete'
    }
  ];

  constructor(
    private activitesService: ActivitesService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check if user is logged in and is admin
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      this.router.navigate(['/login']);
      return;
    }

    // TODO: Load activites from API
    this.loadActivites();
  }

  loadActivites() {
    this.activitesService.getAllActivites().subscribe({
      next: (data) => {
        this.activites = data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement activités', error);
        this.loading = false;
      }
    });
  }

  addActivite() {
    alert('Formulaire d\'ajout d\'activite a implementer');
  }

  onTableAction(event: {action: string, item: any}) {
    const { action, item } = event;

    switch (action) {
      case 'edit':
        this.editActivite(item);
        break;
      case 'delete':
        this.deleteActivite(item.id);
        break;
    }
  }

  editActivite(activite: any) {
    alert('Formulaire d\'edition pour: ' + activite.nom);
  }

  deleteActivite(id: number) {
    if (confirm('Supprimer cette activité ?')) {
      this.activitesService.deleteActivite(id).subscribe({
        next: () => {
          this.activites = this.activites.filter(a => a.id !== id);
        },
        error: (error: any) => {
          console.error('Erreur suppression activité', error);
        }
      });
    }
  }
}