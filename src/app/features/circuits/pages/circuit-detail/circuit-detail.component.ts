import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CircuitService } from '../../../../services/circuit.service';
import { ActivitesService, Activite } from '../../../../services/activites.service';
import { VillesService, VilleDTO } from '../../../../services/villes.service';
import { ZonesService, Zone } from '../../../../services/zones.service';
import { CircuitDTO } from '../../../../models/circuit.dto';

type CircuitProgrammeItem = {
  day: number;
  title?: string;
  approxTime?: string;
  description: string;
  mealsIncluded?: string[];
  activities?: number[];
  villeId?: number;
  isLegacy?: boolean;
};

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
  errorTitle = '';
  errorMessage = '';
  supportingDataNotice = '';
  circuitProgramme: CircuitProgrammeItem[] = [];
  openProgrammeIndex = 0;
  availableActivites: Array<{ id: number; nom: string; zoneId?: number }> = [];
  availableVilles: Array<{ id: number; nom: string; zoneId?: number }> = [];

  constructor(
    private route: ActivatedRoute,
    private circuitService: CircuitService,
    private activitesService: ActivitesService,
    private villesService: VillesService,
    private zonesService: ZonesService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(id) || id <= 0) {
      this.setErrorState(
        'Circuit introuvable',
        'Le circuit demande est invalide ou indisponible.'
      );
      return;
    }

    this.loadCircuit(id);
  }

  private loadCircuit(id: number): void {
    this.loading = true;
    this.errorTitle = '';
    this.errorMessage = '';
    this.supportingDataNotice = '';

    this.circuitService.getCircuitById(id).subscribe({
      next: (circuit) => {
        if (!circuit) {
          this.setErrorState(
            'Circuit introuvable',
            'Le circuit demande ne peut pas etre affiche pour le moment.'
          );
          return;
        }

        if (!circuit.actif) {
          this.setErrorState(
            'Circuit indisponible',
            'Ce circuit nest pas disponible en consultation publique pour le moment.'
          );
          return;
        }

        this.circuit = circuit;
        this.zone = null;
        this.circuitProgramme = this.normalizeProgramme(circuit.programme || []);
        this.openProgrammeIndex = 0;
        this.loading = false;
        this.loadSupportingData(circuit);
      },
      error: (err) => {
        console.error('[CircuitDetail] erreur fetch circuit', err);
        this.setErrorState(
          err?.status === 404 ? 'Circuit introuvable' : 'Circuit indisponible',
          err?.status === 404
            ? 'Le circuit demande nexiste pas ou a ete retire du catalogue.'
            : 'Impossible de charger ce circuit pour le moment. Merci de reessayer plus tard.'
        );
      }
    });
  }

  private loadSupportingData(circuit: CircuitDTO): void {
    const notices: string[] = [];

    forkJoin({
      zones: this.zonesService.getAllZones().pipe(
        catchError((err) => {
          console.error('[CircuitDetail] erreur zones', err);
          notices.push('La zone du circuit ne peut pas etre affichee pour le moment.');
          return of([] as Zone[]);
        })
      ),
      activites: this.activitesService.getAllActivites().pipe(
        catchError((err) => {
          console.error('[CircuitDetail] erreur activites', err);
          notices.push('Les activites associees sont partiellement indisponibles.');
          return of([] as Activite[]);
        })
      ),
      villes: this.villesService.getAll().pipe(
        catchError((err) => {
          console.error('[CircuitDetail] erreur villes', err);
          notices.push('Les villes du programme ne peuvent pas etre resolues.');
          return of([] as VilleDTO[]);
        })
      )
    }).subscribe(({ zones, activites, villes }) => {
      this.zone = (zones || []).find((item) => item.idZone === circuit.zoneId) || null;
      this.availableActivites = (activites || []).map((item) => ({
        id: item.id,
        nom: item.nom,
        zoneId: item.zoneId
      }));
      this.availableVilles = (villes || []).map((item) => ({
        id: item.id,
        nom: item.nom,
        zoneId: item.zoneId ?? undefined
      }));
      this.supportingDataNotice = notices.join(' ');
    });
  }

  private normalizeProgramme(programme: Array<string | any>): CircuitProgrammeItem[] {
    return programme.map((item: any, index: number) => {
      if (typeof item === 'string') {
        return {
          day: index + 1,
          description: item,
          activities: [],
          isLegacy: true
        };
      }

      return {
        day: item.day ?? index + 1,
        title: item.title,
        approxTime: item.approxTime,
        description: item.description ?? '',
        mealsIncluded: item.mealsIncluded ?? [],
        activities: item.activities ?? [],
        villeId: item.villeId,
        isLegacy: false
      };
    });
  }

  private setErrorState(title: string, message: string): void {
    this.loading = false;
    this.circuit = null;
    this.zone = null;
    this.circuitProgramme = [];
    this.availableActivites = [];
    this.availableVilles = [];
    this.supportingDataNotice = '';
    this.errorTitle = title;
    this.errorMessage = message;
  }

  getStatutLabel(actif: boolean): string {
    return actif ? 'Actif' : 'Inactif';
  }

  getStatutClass(actif: boolean): string {
    return actif ? 'status-active' : 'status-inactive';
  }

  toggleExpand(index: number): void {
    this.openProgrammeIndex = index;
  }

  isExpanded(index: number): boolean {
    return this.openProgrammeIndex === index;
  }

  getImageUrl(path: string | undefined | null): string {
    if (!path) {
      return '/assets/images/circuit-default.jpg';
    }

    const raw = path.trim();
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
      return raw;
    }

    const imagePath = raw.startsWith('/') ? raw : `/${raw}`;
    if (imagePath.startsWith('/images') || imagePath.startsWith('/api/images')) {
      return imagePath;
    }

    return imagePath;
  }

  getHeroBackgroundImage(path: string | undefined | null): string {
    return `url('${this.getImageUrl(path)}')`;
  }

  getActivityName(id: number): string {
    const activite = this.availableActivites.find((item) => item.id === id);
    return activite ? activite.nom : `Activite ${id}`;
  }

  getFeaturedCities(): string[] {
    const cities = new Set<string>();

    if (this.circuit?.villeNom) {
      cities.add(this.circuit.villeNom);
    }

    for (const programmeItem of this.circuitProgramme) {
      if (!programmeItem.villeId) {
        continue;
      }

      const ville = this.availableVilles.find((item) => item.id === programmeItem.villeId);
      if (ville?.nom) {
        cities.add(ville.nom);
      }
    }

    return Array.from(cities);
  }
}
