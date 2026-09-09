import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CircuitsPersonnalisesService } from '../../../../services/circuits-personnalises.service';
import { CircuitDTO, ProgrammeDay } from '../../../../models/circuit.dto';
import { PricePipe } from '../../../../shared/pipes/price.pipe';

/**
 * Vue en lecture seule du Circuit catalogue cree pour une demande personnalisee acceptee et
 * payee. Le circuit reste inactif (non expose sur /circuit/:id public), donc route dediee ici
 * plutot que de reutiliser circuit-detail.component.ts (qui porte en plus toute la logique de
 * reservation/paiement, non pertinente : le client a deja paye a ce stade).
 */
@Component({
  standalone: true,
  selector: 'app-mon-circuit-personnalise',
  imports: [CommonModule, RouterModule, PricePipe],
  templateUrl: './mon-circuit-personnalise.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./mon-circuit-personnalise.component.scss']
})
export class MonCircuitPersonnaliseComponent implements OnInit {
  circuit: CircuitDTO | null = null;
  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private circuitsPersonnalisesService: CircuitsPersonnalisesService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('demandeId');
    const demandeId = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(demandeId) || demandeId <= 0) {
      this.loading = false;
      this.errorMessage = 'Demande invalide.';
      return;
    }

    this.circuitsPersonnalisesService.getMineCircuitCree(demandeId).subscribe({
      next: (circuit) => {
        this.circuit = circuit;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.status === 404
          ? "Ce circuit n'est pas encore disponible ou ne vous appartient pas."
          : 'Impossible de charger ce circuit pour le moment.';
      }
    });
  }

  getProgrammeDays(): ProgrammeDay[] {
    if (!this.circuit?.programme) {
      return [];
    }
    return this.circuit.programme.map((item, index) => {
      if (typeof item === 'string') {
        return { day: index + 1, description: item };
      }
      return item;
    });
  }

  getImageUrl(path: string | undefined | null): string {
    if (!path) {
      return '/assets/images/circuit-default.jpg';
    }
    const raw = path.trim();
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
      return raw;
    }
    return raw.startsWith('/') ? raw : `/${raw}`;
  }
}
