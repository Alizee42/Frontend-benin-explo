import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CircuitDTO, ProgrammeDay } from '../../../../models/circuit.dto';
import { CircuitService } from '../../../../services/circuit.service';
import { ActivitesService, Activite } from '../../../../services/activites.service';
import { ZonesService, Zone } from '../../../../services/zones.service';

@Component({
  selector: 'app-circuit-details',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './circuit-details.component.html',
  styleUrls: ['./circuit-details.component.scss']
})
export class CircuitDetailsComponent implements OnInit {
  circuit: CircuitDTO | null = null;
  zone: Zone | null = null;
  loading = true;
  activitesMap = new Map<number, Activite>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private circuitService: CircuitService,
    private zonesService: ZonesService,
    private activitesService: ActivitesService
  ) {}

  ngOnInit() {
    const circuitId = this.route.snapshot.paramMap.get('id');
    if (circuitId) {
      this.loadCircuit(+circuitId);
    }
  }

  loadCircuit(id: number) {
    this.circuitService.getCircuitById(id).subscribe({
      next: (circuit: CircuitDTO) => {
        console.log('[CircuitDetails] Circuit chargé', circuit);
        console.log('[CircuitDetails] Programme reçu', circuit.programme);
        this.circuit = circuit;
        this.loadZone(circuit.zoneId);
        this.loadActivitesForCircuit(circuit);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement circuit', error);
        this.loading = false;
        this.router.navigate(['/admin/circuits']);
      }
    });
  }

  private loadActivitesForCircuit(circuit: CircuitDTO) {
    const ids = new Set<number>();

    // ids globaux du circuit
    if (circuit.activiteIds) {
      circuit.activiteIds.forEach((id: number) => ids.add(id));
    }

    // ids des activités par jour (ProgrammeDay)
    if (circuit.programme && circuit.programme.length) {
      for (const jour of circuit.programme as any[]) {
        if (jour && Array.isArray(jour.activities)) {
          (jour.activities as number[]).forEach((id: number) => ids.add(id));
        }
      }
    }

    if (!ids.size) {
      return;
    }

    this.activitesService.getAllActivites().subscribe({
      next: (activites: Activite[]) => {
        activites.forEach(a => {
          if (ids.has(a.id)) {
            this.activitesMap.set(a.id, a);
          }
        });
      },
      error: (err) => {
        console.error('[CircuitDetails] Erreur chargement activités', err);
      }
    });
  }

  loadZone(zoneId: number | null) {
    if (!zoneId) return;

    this.zonesService.getAllZones().subscribe({
      next: (zones: Zone[]) => {
        this.zone = zones.find((z: Zone) => z.idZone === zoneId) || null;
      },
      error: (error: any) => {
        console.error('Erreur chargement zone', error);
      }
    });
  }

  get uniqueCities(): string[] {
    const cities = new Set<string>();
    if (this.circuit?.villeNom) {
      cities.add(this.circuit.villeNom);
    }
    if (this.circuit?.programme) {
      for (const jour of this.circuit.programme as any[]) {
        if (jour && Array.isArray(jour.activities)) {
          (jour.activities as number[]).forEach((id: number) => {
            const act = this.activitesMap.get(id);
            if (act?.ville) {
              cities.add(act.ville);
            }
          });
        }
      }
    }
    return Array.from(cities);
  }

  isProgrammeDay(jour: string | ProgrammeDay): jour is ProgrammeDay {
    return typeof jour !== 'string';
  }

  getActiviteName(id: number): string {
    const a = this.activitesMap.get(id);
    return a ? a.nom : `Activité ${id}`;
  }

  editCircuit() {
    if (this.circuit) {
      this.router.navigate(['/admin/circuits/edit-circuit', this.circuit.id]);
    }
  }

  goBack() {
    this.router.navigate(['/admin/circuits']);
  }

  getStatutLabel(actif: boolean): string {
    return actif ? 'Actif' : 'Inactif';
  }

  getStatutClass(actif: boolean): string {
    return actif ? 'status-active' : 'status-inactive';
  }
}
