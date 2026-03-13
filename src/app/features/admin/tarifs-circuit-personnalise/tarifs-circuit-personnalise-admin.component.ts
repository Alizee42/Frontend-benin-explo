import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { AdminActionsBarComponent } from '../../../shared/components/admin-actions-bar/admin-actions-bar.component';
import {
  TarifsCircuitPersonnaliseDTO,
  TarifsCircuitPersonnaliseService
} from '../../../services/tarifs-circuit-personnalise.service';

@Component({
  selector: 'app-tarifs-circuit-personnalise-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, AdminActionsBarComponent],
  templateUrl: './tarifs-circuit-personnalise-admin.component.html',
  styleUrls: ['./tarifs-circuit-personnalise-admin.component.scss']
})
export class TarifsCircuitPersonnaliseAdminComponent implements OnInit {
  tarifs: TarifsCircuitPersonnaliseDTO = this.createDefaultTarifs();
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private tarifsService: TarifsCircuitPersonnaliseService) {}

  ngOnInit(): void {
    this.loadTarifs();
  }

  loadTarifs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.tarifsService.getCurrent().subscribe({
      next: (tarifs) => {
        this.tarifs = this.normalizeTarifs(tarifs);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement tarifs circuit personnalise', error);
        this.tarifs = this.createDefaultTarifs();
        this.errorMessage = 'Impossible de charger les tarifs pour le moment.';
        this.isLoading = false;
      }
    });
  }

  saveTarifs(): void {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.tarifs = this.normalizeTarifs(this.tarifs);

    this.tarifsService.save(this.tarifs).subscribe({
      next: (saved) => {
        this.tarifs = this.normalizeTarifs(saved);
        this.successMessage = 'Les tarifs du circuit personnalise ont ete enregistres.';
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Erreur enregistrement tarifs circuit personnalise', error);
        this.errorMessage = 'Impossible d enregistrer les tarifs pour le moment.';
        this.isSaving = false;
      }
    });
  }

  private createDefaultTarifs(): TarifsCircuitPersonnaliseDTO {
    return {
      devise: 'EUR',
      transportCompactParJour: 0,
      transportFamilialParJour: 0,
      transportMinibusParJour: 0,
      transportBusParJour: 0,
      guideParJour: 0,
      chauffeurParJour: 0,
      pensionCompleteParPersonneParJour: 0
    };
  }

  private normalizeTarifs(tarifs: TarifsCircuitPersonnaliseDTO): TarifsCircuitPersonnaliseDTO {
    return {
      id: tarifs.id,
      devise: (tarifs.devise || 'EUR').toUpperCase(),
      transportCompactParJour: this.sanitizeAmount(tarifs.transportCompactParJour),
      transportFamilialParJour: this.sanitizeAmount(tarifs.transportFamilialParJour),
      transportMinibusParJour: this.sanitizeAmount(tarifs.transportMinibusParJour),
      transportBusParJour: this.sanitizeAmount(tarifs.transportBusParJour),
      guideParJour: this.sanitizeAmount(tarifs.guideParJour),
      chauffeurParJour: this.sanitizeAmount(tarifs.chauffeurParJour),
      pensionCompleteParPersonneParJour: this.sanitizeAmount(tarifs.pensionCompleteParPersonneParJour)
    };
  }

  private sanitizeAmount(value: number | null | undefined): number {
    if (value == null || Number.isNaN(Number(value))) {
      return 0;
    }
    return Math.max(Number(value), 0);
  }
}
