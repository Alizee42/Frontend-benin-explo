import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CircuitService } from '../../../../services/circuit.service';
import { CircuitDTO } from '../../../../models/circuit.dto';
import { ZonesService, Zone } from '../../../../services/zones.service';

@Component({
  standalone: true,
  selector: 'app-circuit-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './circuit-detail.component.html',
  styleUrls: ['./circuit-detail.component.scss'],
})
export class CircuitDetailComponent implements OnInit {
  circuit: CircuitDTO | null = null;
  loading = true;
  zone: Zone | null = null;

  constructor(private route: ActivatedRoute, private circuitService: CircuitService, private zonesService: ZonesService) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? +idParam : null;
    if (id) {
      this.circuitService.getCircuitById(id).subscribe({
        next: (c) => {
          this.circuit = c;
          // charger la zone associée si présente
          if (c && c.zoneId) {
            this.zonesService.getZoneById(c.zoneId).subscribe({
              next: z => this.zone = z,
              error: err => {
                console.warn('[CircuitDetail] impossible de charger la zone', err);
                this.zone = null;
              }
            });
          } else {
            this.zone = null;
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('[CircuitDetail] erreur fetch circuit', err);
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  getImageUrl(path: string | undefined | null): string {
    if (!path) return '/assets/images/circuit-default.jpg';
    const raw = path.trim();
    // If already an absolute URL, return as-is
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
      return raw;
    }
    const img = raw.startsWith('/') ? raw : '/' + raw;
    if (img.startsWith('/images') || img.startsWith('/api/images')) {
      return `http://localhost:8080${img}`;
    }
    return img;
  }
}
