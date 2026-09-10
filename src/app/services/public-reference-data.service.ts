import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { ZonesService, Zone } from './zones.service';
import { ActivitesService, Activite } from './activites.service';
import { VillesService, VilleDTO } from './villes.service';

/**
 * Cache partage des referentiels publics (zones, activites, villes) utilises a la fois par
 * la page detail d'un circuit et par l'assistant circuit-personnalise. Sans ce cache, chaque
 * navigation vers un circuit ou chaque etape du formulaire personnalise re-telechargeait ces
 * memes listes completes depuis le backend (bug trouve en audit : state transfer liste<->detail).
 */
@Injectable({
  providedIn: 'root'
})
export class PublicReferenceDataService {

  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  private zones$: Observable<Zone[]> | null = null;
  private zonesExpiry = 0;

  private activites$: Observable<Activite[]> | null = null;
  private activitesExpiry = 0;

  private villes$: Observable<VilleDTO[]> | null = null;
  private villesExpiry = 0;

  constructor(
    private zonesService: ZonesService,
    private activitesService: ActivitesService,
    private villesService: VillesService
  ) {}

  getZones(): Observable<Zone[]> {
    if (!this.zones$ || Date.now() >= this.zonesExpiry) {
      this.zones$ = this.zonesService.getAllZones().pipe(
        tap(() => { this.zonesExpiry = Date.now() + this.TTL; }),
        shareReplay(1)
      );
    }
    return this.zones$;
  }

  getActivites(): Observable<Activite[]> {
    if (!this.activites$ || Date.now() >= this.activitesExpiry) {
      this.activites$ = this.activitesService.getAllActivites().pipe(
        tap(() => { this.activitesExpiry = Date.now() + this.TTL; }),
        shareReplay(1)
      );
    }
    return this.activites$;
  }

  getVilles(): Observable<VilleDTO[]> {
    if (!this.villes$ || Date.now() >= this.villesExpiry) {
      this.villes$ = this.villesService.getAll().pipe(
        tap(() => { this.villesExpiry = Date.now() + this.TTL; }),
        shareReplay(1)
      );
    }
    return this.villes$;
  }

  /** Vide le cache. Utilise si besoin de forcer un rechargement complet. */
  clearCache(): void {
    this.zones$ = null;
    this.activites$ = null;
    this.villes$ = null;
  }
}
