import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { AdminActionsBarComponent } from '../../../shared/components/admin-actions-bar/admin-actions-bar.component';
import { BeButtonComponent } from '../../../shared/components/be-button/be-button.component';
import { AuthService } from '../../../services/auth.service';
import { CircuitService } from '../../../services/circuit.service';
import { ZonesService, Zone } from '../../../services/zones.service';
import { VillesService, VilleDTO } from '../../../services/villes.service';
import { CircuitDTO } from '../../../models/circuit.dto';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-circuits-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, DataTableComponent, AdminActionsBarComponent, BeButtonComponent, ModalComponent],
  templateUrl: './circuits-admin.component.html',
  styleUrls: ['./circuits-admin.component.scss']
})
export class CircuitsAdminComponent implements OnInit {
  confirmDeleteOpen = false;
  pendingDeleteId: number | null = null;

  circuits: CircuitDTO[] = [];
  zones: Zone[] = [];
  villes: VilleDTO[] = [];
  loading = true;
  loadError = '';
  actionError = '';
  searchTerm = '';
  sortBy: 'recent' | 'title-asc' | 'title-desc' | 'price-asc' | 'price-desc' = 'recent';

  // Configuration du tableau
  tableColumns: TableColumn[] = [
    { key: 'img', label: 'Miniature', type: 'image', width: '80px' },
    { key: 'titre', label: 'Nom du circuit', type: 'text' },
    { key: 'villeEtZone', label: 'Ville (Zone géographique)', type: 'text', width: '220px' },
    { key: 'dureeIndicative', label: 'Durée', type: 'text', width: '120px' },
    { key: 'prixIndicatif', label: 'Prix indicatif', type: 'number', width: '120px' },
    { key: 'statut', label: 'Statut', type: 'text', width: '120px' },
    { key: 'aLaUneLabel', label: 'A la une', type: 'text', width: '120px' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '300px' }
  ];

  tableActions: TableAction[] = [
    {
      label: 'Voir détails',
      icon: 'ri-eye-line',
      class: 'btn-info',
      action: 'view-details'
    },
    {
      label: 'Modifier',
      icon: 'ri-edit-line',
      class: 'btn-edit',
      action: 'edit'
    },
    {
      label: 'Actif / inactif',
      icon: 'ri-toggle-line',
      class: 'btn-toggle',
      action: 'toggle-status'
    },
    {
      label: 'Mettre a la une',
      icon: 'ri-star-line',
      class: 'btn-info',
      action: 'toggle-feature-on',
      condition: (item: CircuitDTO) => !item.aLaUne
    },
    {
      label: 'Retirer de la une',
      icon: 'ri-star-off-line',
      class: 'btn-toggle',
      action: 'toggle-feature-off',
      condition: (item: CircuitDTO) => item.aLaUne === true
    },
    {
      label: 'Supprimer',
      icon: 'ri-delete-bin-line',
      class: 'btn-danger',
      action: 'delete'
    }
  ];

  constructor(
    private circuitService: CircuitService,
    private zonesService: ZonesService,
    private villesService: VillesService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check if user is logged in and is admin
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadData();
  }

  loadData(): void {
    forkJoin({
      zones: this.zonesService.getAllZones(),
      villes: this.villesService.getAll()
    }).subscribe({
      next: ({ zones, villes }) => {
        this.zones = zones;
        this.villes = villes.map((v: any) => ({
          id: v.id !== undefined ? v.id : v.idVille,
          nom: v.nom,
          zoneId: v.zoneId ?? v.zone?.id ?? null,
          zoneNom: v.zoneNom ?? (v.zone ? v.zone.nom : ''),
          ...v
        }));
        this.loadCircuits();
      },
      error: () => {
        this.loadError = 'Impossible de charger certaines données de référence.';
        this.loadCircuits();
      }
    });
  }

  loadCircuits() {
    this.loading = true;
    this.actionError = '';
    this.circuitService.getAllCircuits().subscribe({
      next: (data) => {
        // Add zone names and status to circuits
        this.circuits = data.map(circuit => {
          // determine zone name: prefer zoneId on circuit, else use ville -> zone
          let zoneName = this.getZoneName(circuit.zoneId);
          if (!zoneName && circuit.villeId) {
            const ville = this.villes.find(v => v.id === circuit.villeId);
            if (ville && ville.zoneId) {
              zoneName = this.getZoneName(ville.zoneId);
            }
          }

          const villeNom = circuit.villeNom || '';
          const villeEtZone = villeNom ? `${villeNom}${zoneName ? ' (' + zoneName + ')' : ''}` : (circuit.localisation || '');

          return {
            ...circuit,
            villeEtZone,
            statut: circuit.actif ? 'Actif' : 'Inactif',
            aLaUneLabel: circuit.aLaUne ? 'Oui' : 'Non'
          };
        });
        this.loading = false;
      },
      error: (error) => {
        this.loadError = 'Impossible de charger les circuits.';
        this.loading = false;
      }
    });
  }

  get filteredCircuits(): CircuitDTO[] {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.circuits.filter((circuit: any) => {
      if (!term) {
        return true;
      }

      return [
        circuit.titre,
        circuit.resume,
        circuit.villeNom,
        circuit.villeEtZone,
        circuit.localisation,
        circuit.formuleProposee,
        circuit.statut
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term));
    });

    return [...filtered].sort((a: any, b: any) => {
      switch (this.sortBy) {
        case 'title-asc':
          return (a.titre || '').localeCompare(b.titre || '', 'fr');
        case 'title-desc':
          return (b.titre || '').localeCompare(a.titre || '', 'fr');
        case 'price-asc':
          return (a.prixIndicatif || 0) - (b.prixIndicatif || 0);
        case 'price-desc':
          return (b.prixIndicatif || 0) - (a.prixIndicatif || 0);
        case 'recent':
        default:
          return (b.id || 0) - (a.id || 0);
      }
    });
  }

  onRowClick(circuit: any) {
    // Ouvrir les détails du circuit
    this.viewDetails(circuit);
  }

  onTableAction(event: {action: string, item: any}) {
    const { action, item } = event;

    switch (action) {
      case 'view-details':
        this.viewDetails(item);
        break;
      case 'view':
        this.viewCircuit(item);
        break;
      case 'edit':
        this.editCircuit(item);
        break;
      case 'toggle-status':
        this.toggleStatus(item);
        break;
      case 'toggle-feature-on':
        this.toggleFeatured(item, true);
        break;
      case 'toggle-feature-off':
        this.toggleFeatured(item, false);
        break;
      case 'delete':
        this.deleteCircuit(item.id);
        break;
    }
  }

  viewDetails(circuit: any) {
    this.router.navigate(['/admin/circuits/detail', circuit.id]);
  }

  viewCircuit(circuit: any) {
    // Si un slug existe, on l'utilise, sinon on passe l'id
    if (circuit.slug) {
      window.open(`/circuits/${circuit.slug}`, '_blank');
    } else {
      window.open(`/circuits/${circuit.id}`, '_blank');
    }
  }

  editCircuit(circuit: any) {
    this.router.navigate(['/admin/circuits/edit-circuit', circuit.id]);
  }

  toggleStatus(circuit: any) {
    const nouveauStatut = !circuit.actif;
    const payload = this.buildUpdatePayload(circuit, {
      actif: nouveauStatut,
      aLaUne: nouveauStatut ? (circuit.aLaUne === true) : false
    });

    this.circuitService.updateCircuit(circuit.id, payload).subscribe({
      next: () => {
        // Mettre à jour seulement le circuit concerné dans le tableau local
        const index = this.circuits.findIndex(c => c.id === circuit.id);
        if (index !== -1) {
          (this.circuits[index] as any).actif = nouveauStatut;
          (this.circuits[index] as any).statut = nouveauStatut ? 'Actif' : 'Inactif';
          if (!nouveauStatut) {
            (this.circuits[index] as any).aLaUne = false;
            (this.circuits[index] as any).aLaUneLabel = 'Non';
          }
        }
      },
      error: (error) => {
        this.actionError = 'Impossible de modifier le statut du circuit.';
      }
    });
  }

  toggleFeatured(circuit: any, targetValue: boolean) {
    const countFeatured = this.circuits.filter(c => c.aLaUne === true).length;
    if (targetValue && countFeatured >= 4) {
      this.actionError = 'Maximum 4 circuits à la une sur la page d\'accueil.';
      return;
    }
    if (targetValue && !circuit.actif) {
      this.actionError = 'Un circuit inactif ne peut pas être mis à la une.';
      return;
    }

    const payload = this.buildUpdatePayload(circuit, {
      aLaUne: targetValue
    });

    this.circuitService.updateCircuit(circuit.id, payload).subscribe({
      next: () => {
        const index = this.circuits.findIndex(c => c.id === circuit.id);
        if (index !== -1) {
          (this.circuits[index] as any).aLaUne = targetValue;
          (this.circuits[index] as any).aLaUneLabel = targetValue ? 'Oui' : 'Non';
        }
      },
      error: (error) => {
        this.actionError = 'Impossible de mettre a jour la mise en avant du circuit.';
      }
    });
  }

  deleteCircuit(id: number) {
    this.pendingDeleteId = id;
    this.confirmDeleteOpen = true;
  }

  executeDelete(): void {
    if (this.pendingDeleteId == null) return;
    const id = this.pendingDeleteId;
    this.confirmDeleteOpen = false;
    this.pendingDeleteId = null;
    this.circuitService.deleteCircuit(id).subscribe({
      next: () => this.loadCircuits(),
      error: () => { this.actionError = 'Impossible de supprimer ce circuit.'; }
    });
  }

  getZoneName(zoneId: number | null): string {
    if (!zoneId) return 'Non défini';
    const zone = this.zones.find(z => z.idZone === zoneId);
    return zone ? zone.nom : 'Zone inconnue';
  }

  addCircuit() {
    this.router.navigate(['/admin/circuits/add-circuit']);
  }

  private buildUpdatePayload(circuit: any, overrides: Partial<CircuitDTO>): Partial<CircuitDTO> {
    const {
      id,
      villeEtZone,
      statut,
      aLaUneLabel,
      ...persistedFields
    } = circuit;

    return {
      ...persistedFields,
      ...overrides
    };
  }
}
