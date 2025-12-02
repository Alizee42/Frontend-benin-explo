import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CircuitDTO } from '../../../../models/circuit.dto';
import { CircuitService } from '../../../../services/circuit.service';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private circuitService: CircuitService,
    private zonesService: ZonesService
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
        this.circuit = circuit;
        this.loadZone(circuit.zoneId);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement circuit', error);
        this.loading = false;
        this.router.navigate(['/admin/circuits']);
      }
    });
  }

  loadZone(zoneId: number | null) {
    if (!zoneId) return;

    this.zonesService.getAllZones().subscribe({
      next: (zones: Zone[]) => {
        this.zone = zones.find((z: Zone) => z.id === zoneId) || null;
      },
      error: (error: any) => {
        console.error('Erreur chargement zone', error);
      }
    });
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
