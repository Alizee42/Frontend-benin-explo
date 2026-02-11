import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { tap, map, shareReplay } from 'rxjs/operators';
import { ZonesAdminService, ZoneDTO } from './zones-admin.service';
import { VillesService, VilleDTO } from './villes.service';
import { ActivitesService, Activite } from './activites.service';

/**
 * Service de cache optimisé pour le formulaire de création de circuit
 * Gère le chargement intelligent et le cache des données de référence
 */
@Injectable({
  providedIn: 'root'
})
export class CircuitFormCacheService {
  
  // Cache des données avec TTL (Time To Live)
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  
  // Cache des zones (rarement modifiées)
  private zonesCache$: Observable<ZoneDTO[]> | null = null;
  
  // Cache des villes par zone
  private villesCache = new Map<number, {
    data: VilleDTO[];
    expiry: number;
  }>();
  
  // Cache des activités par zone
  private activitesCache = new Map<number, {
    data: Activite[];
    expiry: number;
  }>();

  constructor(
    private zonesService: ZonesAdminService,
    private villesService: VillesService,
    private activitesService: ActivitesService
  ) {}

  /**
   * Récupère toutes les zones (avec cache permanent pendant la session)
   * Les zones changent rarement, donc on les cache de manière agressive
   */
  getZones(): Observable<ZoneDTO[]> {
    if (!this.zonesCache$) {
      this.zonesCache$ = this.zonesService.getAll().pipe(
        shareReplay(1) // Partage le résultat entre tous les subscribers
      );
    }
    return this.zonesCache$;
  }

  /**
   * Récupère les villes d'une zone avec cache intelligent
   * Utilise le cache si disponible, sinon fait un appel API
   */
  getVillesForZone(zoneId: number): Observable<VilleDTO[]> {
    const cached = this.villesCache.get(zoneId);
    
    // Vérifier si le cache est valide
    if (cached && Date.now() < cached.expiry) {
      return of(cached.data);
    }

    // Charger depuis l'API et mettre en cache
    return this.villesService.getByZone(zoneId).pipe(
      tap(villes => {
        this.villesCache.set(zoneId, {
          data: villes,
          expiry: Date.now() + this.TTL
        });
      })
    );
  }

  /**
   * Récupère les activités d'une zone avec cache intelligent
   * Optimisé pour éviter de recharger les mêmes données
   */
  getActivitesForZone(zoneId: number): Observable<Activite[]> {
    const cached = this.activitesCache.get(zoneId);
    
    // Vérifier si le cache est valide
    if (cached && Date.now() < cached.expiry) {
      return of(cached.data);
    }

    // Charger depuis l'API et mettre en cache
    return this.activitesService.getActivitesByZone(zoneId).pipe(
      tap(activites => {
        this.activitesCache.set(zoneId, {
          data: activites,
          expiry: Date.now() + this.TTL
        });
      })
    );
  }

  /**
   * Pré-charge les données essentielles pour le formulaire
   * Optimise l'expérience utilisateur en chargeant uniquement les zones au départ
   */
  preloadEssentials(): Observable<{ zones: ZoneDTO[] }> {
    return this.getZones().pipe(
      map(zones => ({ zones }))
    );
  }

  /**
   * Pré-charge les données pour une zone spécifique
   * Utilisé quand l'utilisateur sélectionne une zone
   */
  preloadZoneData(zoneId: number): Observable<{ villes: VilleDTO[]; activites: Activite[] }> {
    return forkJoin({
      villes: this.getVillesForZone(zoneId),
      activites: this.getActivitesForZone(zoneId)
    });
  }

  /**
   * Invalide le cache pour une zone spécifique
   * Utilisé après des modifications des données
   */
  invalidateZoneCache(zoneId: number): void {
    this.villesCache.delete(zoneId);
    this.activitesCache.delete(zoneId);
  }

  /**
   * Vide tout le cache
   * Utilisé en cas de besoin de rafraîchissement complet
   */
  clearCache(): void {
    this.zonesCache$ = null;
    this.villesCache.clear();
    this.activitesCache.clear();
  }

  /**
   * Vérifie si le cache contient des données pour une zone
   */
  hasCachedDataForZone(zoneId: number): boolean {
    const villesCache = this.villesCache.get(zoneId);
    const activitesCache = this.activitesCache.get(zoneId);
    
    const now = Date.now();
    const villesValid = villesCache && now < villesCache.expiry;
    const activitesValid = activitesCache && now < activitesCache.expiry;
    
    return !!(villesValid && activitesValid);
  }

  /**
   * Obtient des statistiques sur l'état du cache
   * Utile pour le debugging et monitoring
   */
  getCacheStats(): {
    zonesLoaded: boolean;
    villesCachedZones: number;
    activitesCachedZones: number;
    totalCacheSize: number;
  } {
    return {
      zonesLoaded: this.zonesCache$ !== null,
      villesCachedZones: this.villesCache.size,
      activitesCachedZones: this.activitesCache.size,
      totalCacheSize: this.villesCache.size + this.activitesCache.size
    };
  }
}
