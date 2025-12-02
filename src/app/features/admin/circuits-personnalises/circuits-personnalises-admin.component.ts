import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { CircuitsPersonnalisesService, DemandeCircuitPersonnalise } from '../../../services/circuits-personnalises.service';

@Component({
  selector: 'app-circuits-personnalises-admin',
  standalone: true,
  imports: [CommonModule, HeaderComponent, DataTableComponent],
  templateUrl: './circuits-personnalises-admin.component.html',
  styleUrls: ['./circuits-personnalises-admin.component.scss']
})
export class CircuitsPersonnalisesAdminComponent implements OnInit {
  demandes: DemandeCircuitPersonnalise[] = [];
  isLoading = true;

  tableColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'client.nom', label: 'Nom', sortable: true },
    { key: 'client.email', label: 'Email', sortable: false },
    { key: 'client.telephone', label: 'Téléphone', sortable: false },
    { key: 'dateCreation', label: 'Date', sortable: true },
    { key: 'statut', label: 'Statut', sortable: true }
  ];

  tableActions = [
    {
      label: 'Voir détails',
      action: 'view',
      class: 'btn-view',
      icon: '👁️'
    },
    {
      label: 'Approuver',
      action: 'approve',
      class: 'btn-approve',
      icon: '✅',
      condition: (item: DemandeCircuitPersonnalise) => item.statut === 'En attente'
    },
    {
      label: 'Refuser',
      action: 'reject',
      class: 'btn-reject',
      icon: '❌',
      condition: (item: DemandeCircuitPersonnalise) => item.statut === 'En attente'
    }
  ];

  constructor(
    private circuitsPersonnalisesService: CircuitsPersonnalisesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDemandes();
  }

  loadDemandes() {
    this.isLoading = true;
    this.circuitsPersonnalisesService.getAllDemandes().subscribe({
      next: (data) => {
        this.demandes = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement demandes', error);
        this.isLoading = false;
      }
    });
  }

  onActionClick(actionData: { action: string; item: DemandeCircuitPersonnalise }) {
    const { action, item } = actionData;

    switch (action) {
      case 'view':
        this.router.navigate(['/admin/circuits-personnalises/detail', item.id]);
        break;
      case 'approve':
        this.approveDemande(item.id);
        break;
      case 'reject':
        this.rejectDemande(item.id);
        break;
    }
  }

  approveDemande(id: number) {
    if (confirm('Êtes-vous sûr de vouloir approuver cette demande ?')) {
      this.circuitsPersonnalisesService.updateStatut(id, 'Validé').subscribe({
        next: (demande: DemandeCircuitPersonnalise) => {
          console.log('Demande approuvée:', demande);
          this.loadDemandes(); // Recharger la liste
        },
        error: (error: any) => {
          console.error('Erreur approbation demande', error);
        }
      });
    }
  }

  rejectDemande(id: number) {
    const motif = prompt('Motif du refus :');
    if (motif) {
      this.circuitsPersonnalisesService.updateStatut(id, 'Refusé').subscribe({
        next: (demande: DemandeCircuitPersonnalise) => {
          console.log('Demande refusée:', demande);
          this.loadDemandes(); // Recharger la liste
        },
        error: (error: any) => {
          console.error('Erreur refus demande', error);
        }
      });
    }
  }

  get totalDemandes(): number {
    return this.demandes.length;
  }

  get demandesEnAttente(): number {
    return this.demandes.filter(d => d.statut === 'En attente').length;
  }

  get demandesApprouvees(): number {
    return this.demandes.filter(d => d.statut === 'Validé').length;
  }

  get demandesRefusees(): number {
    return this.demandes.filter(d => d.statut === 'Refusé').length;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}