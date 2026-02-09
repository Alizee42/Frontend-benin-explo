import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CircuitsPersonnalisesService, CircuitPersonnaliseDTO } from '../../../../services/circuits-personnalises.service';

@Component({
  selector: 'app-circuit-personnalise-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './circuit-personnalise-detail.component.html',
  styleUrls: ['./circuit-personnalise-detail.component.scss']
})
export class CircuitPersonnaliseDetailComponent implements OnInit {
  demande: CircuitPersonnaliseDTO | null = null;
  isLoading = true;
  demandeId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private circuitsPersonnalisesService: CircuitsPersonnalisesService
  ) {}

  ngOnInit() {
    this.demandeId = this.route.snapshot.paramMap.get('id');
    if (this.demandeId) {
      this.loadDemande();
    }
  }

  loadDemande() {
    if (!this.demandeId) return;

    this.isLoading = true;
    this.circuitsPersonnalisesService.getDemandeById(+this.demandeId).subscribe({
      next: (demande: CircuitPersonnaliseDTO) => {
        this.demande = demande;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement demande', error);
        this.isLoading = false;
        this.router.navigate(['/admin/circuits-personnalises']);
      }
    });
  }

  approveDemande() {
    if (!this.demande || !confirm('Êtes-vous sûr de vouloir approuver cette demande ?')) return;

    this.circuitsPersonnalisesService.updateStatut(this.demande.id!, 'ACCEPTE').subscribe({
      next: (demande: CircuitPersonnaliseDTO) => {
        this.demande = demande;
      },
      error: (error: any) => {
        console.error('Erreur approbation demande', error);
      }
    });
  }

  rejectDemande() {
    if (!this.demande) return;

    const motif = prompt('Motif du refus :');
    if (motif) {
      this.circuitsPersonnalisesService.updateStatut(this.demande.id!, 'REFUSE').subscribe({
        next: (demande: CircuitPersonnaliseDTO) => {
          this.demande = demande;
        },
        error: (error: any) => {
          console.error('Erreur refus demande', error);
        }
      });
    }
  }

  // TODO: Implémenter convertToCircuit si nécessaire
  /*
  convertToCircuit() {
    // Fonctionnalité à implémenter coté backend
  }
  */

  goBack() {
    this.router.navigate(['/admin/circuits-personnalises']);
  }

  getStatusBadgeClass(statut: string): string {
    switch (statut) {
      case 'ACCEPTE':
        return 'status-approved';
      case 'REFUSE':
        return 'status-rejected';
      case 'EN_ATTENTE':
        return 'status-pending';
      case 'EN_TRAITEMENT':
        return 'status-processing';
      case 'TERMINE':
        return 'status-completed';
      default:
        return 'status-default';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrix(prix?: number): string {
    if (!prix) return 'Non estimé';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(prix);
  }
}