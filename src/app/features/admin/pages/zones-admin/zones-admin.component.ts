import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';
import { AuthService } from '../../../../services/auth.service';
import { ZonesService, Zone } from '../../../../services/zones.service';

@Component({
  selector: 'app-zones-admin',
  standalone: true,
  imports: [CommonModule, HeaderComponent, DataTableComponent],
  templateUrl: './zones-admin.component.html',
  styleUrls: ['./zones-admin.component.scss']
})
export class ZonesAdminComponent implements OnInit {
  zones: Zone[] = [];
  loading = true;

  // Configuration du tableau
  tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number', width: '80px' },
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'region', label: 'Région', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'zonesProches', label: 'Zones proches', type: 'array' },
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
    private zonesService: ZonesService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check if user is logged in and is admin
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      this.router.navigate(['/login']);
      return;
    }

    // TODO: Load zones from API
    this.loadZones();
  }

  loadZones() {
    this.zonesService.getAllZones().subscribe({
      next: (data) => {
        this.zones = data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement zones', error);
        this.loading = false;
      }
    });
  }

  addZone() {
    alert('Formulaire d\'ajout de zone à implémenter');
  }

  onTableAction(event: {action: string, item: any}) {
    const { action, item } = event;

    switch (action) {
      case 'edit':
        this.editZone(item);
        break;
      case 'delete':
        this.deleteZone(item.id);
        break;
    }
  }

  editZone(zone: any) {
    alert('Formulaire d’édition pour: ' + zone.nom);
  }

  deleteZone(id: number) {
    if (confirm('Supprimer cette zone ?')) {
      this.zonesService.deleteZone(id).subscribe({
        next: () => {
          this.zones = this.zones.filter(z => z.id !== id);
        },
        error: (error: any) => {
          console.error('Erreur suppression zone', error);
        }
      });
    }
  }
}