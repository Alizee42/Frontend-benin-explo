import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { AuthService } from '../../../services/auth.service';
import { CircuitService } from '../../../services/circuit.service';
import { ZonesService, Zone } from '../../../services/zones.service';
import { VillesService, VilleDTO } from '../../../services/villes.service';
import { CircuitDTO } from '../../../models/circuit.dto';

@Component({
  selector: 'app-circuits-admin',
  standalone: true,
  imports: [CommonModule, HeaderComponent, DataTableComponent],
  templateUrl: './circuits-admin.component.html',
  styleUrls: ['./circuits-admin.component.scss']
})
export class CircuitsAdminComponent implements OnInit {
  circuits: CircuitDTO[] = [];
  zones: Zone[] = [];
  villes: VilleDTO[] = [];
  loading = true;

  // Configuration du tableau
  tableColumns: TableColumn[] = [
    { key: 'img', label: 'Miniature', type: 'image', width: '80px' },
    { key: 'titre', label: 'Nom du circuit', type: 'text' },
    { key: 'villeEtZone', label: 'Ville (Zone géographique)', type: 'text', width: '220px' },
    { key: 'dureeIndicative', label: 'Durée', type: 'text', width: '120px' },
    { key: 'prixIndicatif', label: 'Prix indicatif', type: 'number', width: '120px' },
    { key: 'statut', label: 'Statut', type: 'text', width: '120px' },
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
      label: 'Voir sur le site',
      icon: 'ri-external-link-line',
      class: 'btn-default',
      action: 'view'
    },
    {
      label: 'Modifier',
      icon: 'ri-edit-line',
      class: 'btn-edit',
      action: 'edit'
    },
    {
      label: 'Activer / désactiver',
      icon: 'ri-toggle-line',
      class: 'btn-toggle',
      action: 'toggle-status'
    },
    {
      label: 'Supprimer',
      icon: 'ri-delete-bin-line',
      class: 'btn-delete',
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

    // Load zones first, then villes, then circuits
    this.loadZones();
  }

  loadZones() {
    this.zonesService.getAllZones().subscribe({
      next: (zones) => {
        this.zones = zones;
        this.loadVilles();
      },
      error: (error) => {
        console.error('Erreur chargement zones', error);
        this.loadVilles(); // Try to load villes and circuits anyway
      }
    });
  }

  loadVilles() {
    this.villesService.getAll().subscribe({
      next: (villes) => {
        this.villes = villes.map((v: any) => ({
          id: v.id !== undefined ? v.id : v.idVille,
          nom: v.nom,
          zoneId: v.zoneId ?? v.zone?.id ?? null,
          zoneNom: v.zoneNom ?? (v.zone ? v.zone.nom : ''),
          ...v
        }));
        this.loadCircuits();
      },
      error: (err) => {
        console.error('Erreur chargement villes', err);
        this.loadCircuits();
      }
    });
  }

  loadCircuits() {
    console.log('Loading circuits from API');
    this.circuitService.getAllCircuits().subscribe({
      next: (data) => {
        console.log('Circuits loaded from API:', data.length, 'circuits');
        console.log('Sample imgs from API (first 5):', data.slice(0, 5).map((c: any) => c.img));
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
            statut: circuit.actif ? 'Actif' : 'Inactif'
          };
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement circuits', error);
        this.loading = false;
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

    // Créer un payload propre avec seulement les propriétés nécessaires
    const payload = {
      titre: circuit.titre,
      resume: circuit.resume,
      description: circuit.description,
      dureeIndicative: circuit.dureeIndicative,
      prixIndicatif: circuit.prixIndicatif,
      formuleProposee: circuit.formuleProposee,
      localisation: circuit.localisation,
      actif: nouveauStatut,
      zoneId: circuit.zoneId,
      activiteIds: circuit.activiteIds,
      img: circuit.img,
      galerie: circuit.galerie,
      programme: circuit.programme,
      pointsForts: circuit.pointsForts,
      inclus: circuit.inclus,
      nonInclus: circuit.nonInclus
    };

    this.circuitService.updateCircuit(circuit.id, payload).subscribe({
      next: (response) => {
        // Mettre à jour seulement le circuit concerné dans le tableau local
        const index = this.circuits.findIndex(c => c.id === circuit.id);
        if (index !== -1) {
          (this.circuits[index] as any).actif = nouveauStatut;
          (this.circuits[index] as any).statut = nouveauStatut ? 'Actif' : 'Inactif';
        }
      },
      error: (error) => {
        console.error('Erreur changement de statut circuit', error);
      }
    });
  }

  deleteCircuit(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce circuit ?')) {
      this.circuitService.deleteCircuit(id).subscribe({
        next: () => {
          console.log('Circuit supprimé:', id);
          this.loadCircuits();
        },
        error: (error) => {
          console.error('Erreur suppression circuit', error);
        }
      });
    }
  }

  getZoneName(zoneId: number | null): string {
    if (!zoneId) return 'Non défini';
    const zone = this.zones.find(z => z.id === zoneId);
    return zone ? zone.nom : 'Zone inconnue';
  }

  addCircuit() {
    this.router.navigate(['/admin/circuits/add-circuit']);
  }
}