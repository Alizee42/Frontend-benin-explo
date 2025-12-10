import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CircuitService } from '../../../../services/circuit.service';
import { ActivitesService } from '../../../../services/activites.service';
import { VillesService, VilleDTO } from '../../../../services/villes.service';
import { ZonesService, Zone } from '../../../../services/zones.service';
import { CircuitDTO } from '../../../../models/circuit.dto';

@Component({
  standalone: true,
  selector: 'app-circuit-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './circuit-detail.component.html',
  styleUrls: ['./circuit-detail.component.scss'],
})
export class CircuitDetailComponent implements OnInit {
  circuit: CircuitDTO | null = null;
  zone: Zone | null = null;
  loading = true;
  // structured programme for display: normalize backend format (string[] or structured)
  circuitProgramme: Array<{ day: number; title?: string; approxTime?: string; description: string; mealsIncluded?: string[]; activities?: number[]; villeId?: number; incompatibleActivities?: number[]; isLegacy?: boolean }> = [];
  // indices des jours étendus (pour "lire la suite")
  expandedDays = new Set<number>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private circuitService: CircuitService,
    private activitesService: ActivitesService,
    private villesService: VillesService,
    private zonesService: ZonesService
  ) {}

  availableActivites: Array<{ id: number; nom: string; zoneId?: number }> = [];
  availableVilles: Array<{ id: number; nom: string; zoneId?: number }> = [];

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? +idParam : null;
    if (id) {
      this.circuitService.getCircuitById(id).subscribe({
        next: (c) => {
          this.circuit = c;
          // normalize programme
          const prog = (c.programme || []);
          this.circuitProgramme = prog.map((p: any, idx: number) => {
            if (typeof p === 'string') return { day: idx + 1, description: p, activities: [], isLegacy: true } as any;
            return { day: p.day ?? idx + 1, title: p.title, approxTime: p.approxTime, description: p.description ?? '', activities: p.activities ?? [], villeId: p.villeId, isLegacy: false } as any;
          });
          // load activities and villes for display + compatibility checks
          this.activitesService.getAllActivites().subscribe({ next: acts => { this.availableActivites = acts.map(a => ({ id: a.id, nom: a.nom, zoneId: a.zoneId })); this.checkCompatibility(); }, error: () => { this.checkCompatibility(); } });
          this.villesService.getAll().subscribe({ next: (vs: VilleDTO[]) => { this.availableVilles = vs.map((v: VilleDTO) => ({ id: v.id, nom: v.nom, zoneId: v.zoneId ?? undefined })); this.checkCompatibility(); }, error: () => { this.checkCompatibility(); } });
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

  loadZone(zoneId: number | null) {
    if (!zoneId) return;
    this.zonesService.getAllZones().subscribe({
      next: (zones) => {
        this.zone = zones.find(z => z.id === zoneId) || null;
      },
      error: (err) => {
        console.error('[CircuitDetail] erreur loadZone', err);
      }
    });
  }

  editCircuit() {
    if (this.circuit) {
      this.router.navigate(['/admin/circuits/edit-circuit', this.circuit.id]);
    }
  }

  goBack() {
    this.router.navigate(['/circuit']);
  }

  getStatutLabel(actif: boolean): string {
    return actif ? 'Actif' : 'Inactif';
  }

  getStatutClass(actif: boolean): string {
    return actif ? 'status-active' : 'status-inactive';
  }

  /**
   * Vérifie pour chaque jour si des activités sélectionnées proviennent d'une zone différente
   * que la ville indiquée pour ce jour (ou la ville principale du circuit si absente).
   */
  checkCompatibility(): void {
    if (!this.circuitProgramme || !this.availableActivites) return;
    for (const p of this.circuitProgramme) {
      p.incompatibleActivities = [];
      const jourVilleId = (p as any).villeId ?? (this.circuit && ((this.circuit as any).villeId || (this.circuit as any).ville?.id));
      let jourZoneId: number | undefined = undefined;
      if (jourVilleId) {
        const v = this.availableVilles.find(x => x.id === jourVilleId);
        jourZoneId = v ? v.zoneId : undefined;
      }
      if (!p.activities || !p.activities.length) continue;
      for (const aid of p.activities) {
        const a = this.availableActivites.find(x => x.id === aid);
        if (!a) continue;
        if (jourZoneId !== undefined && a.zoneId !== undefined && a.zoneId !== jourZoneId) {
          p.incompatibleActivities!.push(aid);
        }
      }
    }
  }

  isActivityIncompatible(p: any, aid: number): boolean {
    return !!(p.incompatibleActivities && p.incompatibleActivities.indexOf(aid) !== -1);
  }

  toggleExpand(index: number) {
    if (this.expandedDays.has(index)) this.expandedDays.delete(index);
    else this.expandedDays.add(index);
  }

  isExpanded(index: number): boolean {
    return this.expandedDays.has(index);
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

  getActivityName(id: number): string {
    const a = this.availableActivites.find(x => x.id === id);
    return a ? a.nom : 'Activité ' + id;
  }
}
