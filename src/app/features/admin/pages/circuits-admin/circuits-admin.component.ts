import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';
import { AddCircuitModalComponent } from '../../../../shared/components/add-circuit-modal/add-circuit-modal.component';
import { AuthService } from '../../../../services/auth.service';
import { CircuitService } from '../../../../services/circuit.service';
import { CircuitDTO } from '../../../../models/circuit.dto';

@Component({
  selector: 'app-circuits-admin',
  standalone: true,
  imports: [CommonModule, HeaderComponent, DataTableComponent, AddCircuitModalComponent],
  templateUrl: './circuits-admin.component.html',
  styleUrls: ['./circuits-admin.component.scss']
})
export class CircuitsAdminComponent implements OnInit {
  circuits: CircuitDTO[] = [];
  loading = true;

  // Référence à la modale
  @ViewChild('addCircuitModal') addCircuitModal!: AddCircuitModalComponent;

  // Configuration du tableau
  tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number', width: '80px' },
    { key: 'nom', label: 'Nom du circuit', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'dureeIndicative', label: 'Durée (jours)', type: 'number', width: '120px' },
    { key: 'prixIndicatif', label: 'Prix (€)', type: 'number', width: '100px' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '160px' }
  ];

  tableActions: TableAction[] = [
    {
      label: 'Voir détails',
      icon: 'ri-eye-line',
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
      label: 'Supprimer',
      icon: 'ri-delete-bin-line',
      class: 'btn-delete',
      action: 'delete'
    }
  ];

  constructor(
    private circuitService: CircuitService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check if user is logged in and is admin
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      this.router.navigate(['/login']);
      return;
    }

    // Load circuits
    this.loadCircuits();
  }

  loadCircuits() {
    console.log('Loading circuits from API');
    this.circuitService.getAllCircuits().subscribe({
      next: (data) => {
        console.log('Circuits loaded:', data);
        this.circuits = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement circuits', error);
        this.loading = false;
      }
    });
  }

  editCircuit(circuit: any) {
    alert('Modification du circuit: ' + circuit.nom);
  }

  deleteCircuit(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce circuit ?')) {
      alert('Suppression du circuit ID: ' + id);
    }
  }

  addCircuit() {
    console.log('Ouverture modale ajout circuit');
    if (this.addCircuitModal) {
      this.addCircuitModal.open();
    }
  }

  onCircuitSaved(circuit: CircuitDTO) {
    console.log('Nouveau circuit ajouté:', circuit);
    // Recharger la liste des circuits
    this.loadCircuits();
  }

  onModalClosed() {
    console.log('Modale fermée');
  }

  onTableAction(event: {action: string, item: any}) {
    const { action, item } = event;

    switch (action) {
      case 'view':
        this.viewCircuit(item);
        break;
      case 'edit':
        this.editCircuit(item);
        break;
      case 'delete':
        this.deleteCircuit(item.id);
        break;
    }
  }

  viewCircuit(circuit: any) {
    alert('Détails du circuit: ' + circuit.nom);
  }
}