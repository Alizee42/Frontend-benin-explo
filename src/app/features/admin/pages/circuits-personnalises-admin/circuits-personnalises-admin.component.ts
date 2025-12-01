import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AuthService } from '../../../../services/auth.service';
import { CircuitsPersonnalisesService, DemandeCircuitPersonnalise } from '../../../../services/circuits-personnalises.service';

@Component({
  selector: 'app-circuits-personnalises-admin',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './circuits-personnalises-admin.component.html',
  styleUrls: ['./circuits-personnalises-admin.component.scss']
})
export class CircuitsPersonnalisesAdminComponent implements OnInit {
  demandes: DemandeCircuitPersonnalise[] = [];
  loading = true;

  constructor(
    private circuitsPersonnalisesService: CircuitsPersonnalisesService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check if user is logged in and is admin
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      this.router.navigate(['/login']);
      return;
    }

    // TODO: Load demandes from API
    this.loadDemandes();
  }

  loadDemandes() {
    this.circuitsPersonnalisesService.getAllDemandes().subscribe({
      next: (data) => {
        this.demandes = data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement demandes', error);
        this.loading = false;
      }
    });
  }

  voirDemande(demande: any) {
    alert('Voir les détails de la demande: ' + demande.client.nom);
  }

  validerDemande(id: number) {
    if (confirm('Valider cette demande de circuit personnalisé ?')) {
      this.circuitsPersonnalisesService.updateStatut(id, 'Validé').subscribe({
        next: (demande) => {
          const index = this.demandes.findIndex(d => d.id === id);
          if (index !== -1) {
            this.demandes[index] = demande;
          }
        },
        error: (error: any) => {
          console.error('Erreur validation demande', error);
        }
      });
    }
  }

  refuserDemande(id: number) {
    if (confirm('Refuser cette demande de circuit personnalisé ?')) {
      this.circuitsPersonnalisesService.updateStatut(id, 'Refusé').subscribe({
        next: (demande) => {
          const index = this.demandes.findIndex(d => d.id === id);
          if (index !== -1) {
            this.demandes[index] = demande;
          }
        },
        error: (error: any) => {
          console.error('Erreur refus demande', error);
        }
      });
    }
  }

  contacterClient(demande: any) {
    window.open(`mailto:${demande.client.email}?subject=Circuit personnalisé - Demande ${demande.id}`);
  }
}