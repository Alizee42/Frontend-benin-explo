import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CircuitDTO, PointFort } from '../../../../models/circuit.dto';
import { CircuitService } from '../../../../services/circuit.service';
import { ActivitesService, Activite } from '../../../../services/activites.service';
import { ZonesAdminService, ZoneDTO as Zone } from '../../../../services/zones-admin.service';
import { VillesService, VilleDTO } from '../../../../services/villes.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-circuit',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './add-circuit.component.html',
  styleUrls: ['./add-circuit.component.scss']
})
export class AddCircuitComponent {
  circuit: CircuitDTO = {
    id: 0,
    titre: '',
    resume: '',
    description: '',
    dureeIndicative: '',
    prixIndicatif: 0,
    formuleProposee: '',
    localisation: '',
    actif: true,
    zoneId: null,
    villeId: null,
    villeNom: '',
    activiteIds: [],
    img: '',
    galerie: [],
    programme: [''],
    tourisme: [''],
    aventures: [''],
    pointsForts: [{ icon: '', title: '', desc: '' }],
    inclus: [''],
    nonInclus: ['']
  };

  // Conversion EUR <-> XOF
  readonly RATE_XOF_PER_EUR = 655.957;
  // Si coché, l'administrateur saisit le prix en XOF (CFA) dans le champ prix;
  // on convertira en EUR avant l'envoi au backend.
  saisirEnCFA = false;

  zones: Zone[] = [];
  // Cache des noms de zones par id — utile si les activités arrivent
  // avant la liste complète de zones (évite d'afficher "Zone #id").
  zoneNameCache: Record<number, string> = {};
  villes: VilleDTO[] = [];
  isLoading = false;
  heroImageFile: File | null = null;
  galerieFiles: File[] = [];
  // Previews
  heroPreview: string | null = null;
  galeriePreviews: string[] = [];
  currentStep = 1;

  // ProgrammeDays pour l'éditeur (un jour = zones + villes + activités + titre optionnel)
  // selectedZoneIds / selectedVilleIds sont uniquement pour l'UI; le backend reçoit juste les activities[] par jour.
  programmeDays: Array<{
    day: number;
    title?: string;
    zoneId?: number | null;      // conservé pour compat, mais l'UI utilise selectedZoneIds
    villeId?: number | null;     // conservé pour compat, mais l'UI utilise selectedVilleIds
    selectedZoneIds?: number[];  // plusieurs zones possibles dans une journée
    selectedVilleIds?: number[]; // plusieurs villes possibles dans ces zones
    activities?: number[];
    notes?: string;
  }> = [
    {
      day: 1,
      zoneId: null,
      villeId: null,
      selectedZoneIds: [],
      selectedVilleIds: [],
      activities: []
    }
  ];

  // Available activities to choose from
  availableActivites: Activite[] = [];
  // per-day UI state: search filter and option to show all activities
  activityFilterText: string[] = [];
  showAllActivitiesForDay: boolean[] = [];
  compactView: boolean[] = []; // nouvelle option pour vue compacte
  dayExpanded: boolean[] = []; // état d'expansion pour l'accordéon des jours
  // per-day expansion state for groups (zoneKey => boolean)
  expandedZoneState: Array<Record<string, boolean>> = [];
  // Caches pré-calculés pour éviter recomputation excessive depuis le template
  computedGroups: Array<any[]> = [];
  computedSelectedActivities: Array<Activite[]> = [];
  computedVillesPerDay: Array<VilleDTO[]> = [];
  // Flags d'affichage des erreurs par étape
  showErrorsStep1 = false;
  showErrorsStep2 = false;
  showErrorsStep3 = false;

  // Logique de compatibilité géographique des zones
  // Les zones adjacentes sont compatibles, mais pas les extrêmes (Sud-Nord)
  private readonly ZONE_COMPATIBILITY: Record<string, string[]> = {
    'Sud': ['Sud', 'Centre'],      // Sud peut être avec Sud ou Centre
    'Centre': ['Sud', 'Centre', 'Nord'], // Centre peut être avec toutes
    'Nord': ['Centre', 'Nord']     // Nord peut être avec Centre ou Nord
  };


  // Points forts prédéfinis
  predefinedPointsForts = [
    { icon: '🏛️', title: 'Histoire & Culture', desc: 'Découvrez le riche patrimoine historique et culturel du Bénin' },
    { icon: '🌿', title: 'Nature & Écologie', desc: 'Explorez la biodiversité exceptionnelle et les écosystèmes préservés' },
    { icon: '🍲', title: 'Gastronomie locale', desc: 'Dégustez les saveurs authentiques de la cuisine béninoise' },
    { icon: '🏖️', title: 'Plages & Détente', desc: 'Profitez des côtes magnifiques et des moments de relaxation' },
    { icon: '🏞️', title: 'Paysages exceptionnels', desc: 'Admirez des panoramas à couper le souffle' },
    { icon: '🎭', title: 'Traditions vivantes', desc: 'Immergez-vous dans les coutumes et rituels ancestraux' },
    { icon: '🚶', title: 'Randonnées', desc: 'Parcourez des sentiers naturels et découvrez la faune' },
    { icon: '🏊', title: 'Activités aquatiques', desc: 'Nagez dans les lagunes et rivières cristallines' },
    { icon: '🎨', title: 'Art & Artisanat', desc: 'Rencontrez les artisans et leurs créations uniques' },
    { icon: '🏰', title: 'Patrimoine architectural', desc: 'Visitez des sites historiques et monuments remarquables' },
    { icon: '🌅', title: 'Couchers de soleil', desc: 'Assistez à des spectacles naturels inoubliables' },
    { icon: '🐘', title: 'Faune sauvage', desc: 'Observez les animaux dans leur habitat naturel' },
    { icon: '🌺', title: 'Flore tropicale', desc: 'Découvrez une végétation luxuriante et colorée' },
    { icon: '🎶', title: 'Musique & Danse', desc: 'Vivez au rythme des percussions et danses traditionnelles' },
    { icon: '🏺', title: 'Archéologie', desc: 'Explorez les vestiges du passé africain' }
  ];

  constructor(
    private circuitService: CircuitService,
    private zonesService: ZonesAdminService,
    private villesService: VillesService,
    private activitesService: ActivitesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadZones();
    this.loadVilles();
    this.loadActivites();
    // initialize programmeDays from existing circuit.programme if present (compat: string[])
    if (this.circuit.programme && this.circuit.programme.length > 0) {
      // compat : si programme = string[], on crée juste des jours vides avec ville du circuit
      this.programmeDays = this.circuit.programme.map((p: any, idx: number) => {
        if (typeof p === 'string') {
          return {
            day: idx + 1,
            zoneId: this.circuit.zoneId ?? null,
            villeId: null,
            selectedZoneIds: this.circuit.zoneId != null ? [this.circuit.zoneId] : [],
            selectedVilleIds: [],
            activities: [],
            notes: p
          };
        }
        return {
          day: p.day ?? idx + 1,
          title: p.title,
          zoneId: this.circuit.zoneId ?? null,
          villeId: p.villeId ?? null,
          selectedZoneIds: this.circuit.zoneId != null ? [this.circuit.zoneId] : [],
          selectedVilleIds: p.villeId != null ? [p.villeId] : [],
          activities: p.activities ?? [],
          notes: p.description ?? ''
        };
      });
      // init per-day UI arrays
      this.activityFilterText = this.programmeDays.map(() => '');
      this.showAllActivitiesForDay = this.programmeDays.map(() => false);
      this.compactView = this.programmeDays.map(() => false); // initialiser compactView
      this.dayExpanded = this.programmeDays.map((_, idx) => idx === 0); // ouvrir le premier jour par défaut
      this.expandedZoneState = this.programmeDays.map(() => ({}));
      // init computed caches
      this.computedGroups = this.programmeDays.map(() => []);
      this.computedSelectedActivities = this.programmeDays.map(() => []);
      this.computedVillesPerDay = this.programmeDays.map(() => []);
      // precompute for all days
      this.recomputeAllDays();
    }
    else {
      // ensure per-day UI arrays and caches exist for the default single day
      this.activityFilterText = this.programmeDays.map(() => '');
      this.showAllActivitiesForDay = this.programmeDays.map(() => false);
      this.compactView = this.programmeDays.map(() => false);
      this.dayExpanded = this.programmeDays.map((_, idx) => idx === 0);
      this.expandedZoneState = this.programmeDays.map(() => ({}));
      this.computedGroups = this.programmeDays.map(() => []);
      this.computedSelectedActivities = this.programmeDays.map(() => []);
      this.computedVillesPerDay = this.programmeDays.map(() => []);
      this.recomputeAllDays();
    }
  }

  loadActivites() {
    // load full list of activities so admin can pick per day
    this.activitesService.getAllActivites().subscribe({
      next: (acts) => {
        this.availableActivites = acts;
        // Recompute caches now that activities are available
        this.recomputeAllDays();
      },
      error: (err) => console.error('Erreur chargement activités', err)
    });
  }

  /** Villes proposées pour un jour donné, en fonction des zones sélectionnées pour ce jour */
  getVillesForDay(index: number): VilleDTO[] {
    const day = this.programmeDays[index];
    if (!day) {
      return [];
    }

    // Utiliser les zones sélectionnées pour ce jour (multi-zones possible).
    const zoneIds = (day.selectedZoneIds && day.selectedZoneIds.length)
      ? day.selectedZoneIds
      : (day.zoneId != null
          ? [day.zoneId]
          : (this.circuit.zoneId != null ? [this.circuit.zoneId] : []));

    if (!zoneIds.length) {
      return [];
    }

    return this.villes.filter(v => v.zoneId != null && zoneIds.includes(v.zoneId));
  }

  // Recompute helpers: fill computed arrays for a given day index
  recomputeDay(index: number) {
    if (index < 0 || index >= this.programmeDays.length) return;
    // villes
    this.computedVillesPerDay[index] = this.getVillesForDay(index) || [];
    // selected activities (données complètes)
    const day = this.programmeDays[index];
    const selectedIds = new Set(day?.activities || []);
    this.computedSelectedActivities[index] = (this.availableActivites || []).filter(a => selectedIds.has(a.id));
    // available groups
    this.computedGroups[index] = this.getAvailableActivitiesGroupedRaw(index);
  }

  private recomputeAllDays() {
    for (let i = 0; i < this.programmeDays.length; i++) {
      this.recomputeDay(i);
    }
  }

  /** Retourne la liste d'activités autorisées pour le jour `index` en fonction des zones/villes sélectionnées */
  getActivitiesForDay(index: number): Activite[] {
    const day = this.programmeDays[index];
    if (!day) {
      return [];
    }

    let baseList = this.availableActivites || [];

    // 1) Déterminer les zones prises en compte pour ce jour
    const zoneIds = (day.selectedZoneIds && day.selectedZoneIds.length)
      ? day.selectedZoneIds
      : (day.zoneId != null
          ? [day.zoneId]
          : (this.circuit.zoneId != null ? [this.circuit.zoneId] : []));


    if (zoneIds.length) {
      baseList = baseList.filter(a => a.zoneId != null && zoneIds.includes(a.zoneId));
    } else {
      // aucune zone choisie → retourner toutes les activités (catalogue complet)
      return baseList;
    }

    // 2) Villes sélectionnées : multi-villes possible (ou ancienne propriété villeId pour compat)
    const villeIds = (day.selectedVilleIds && day.selectedVilleIds.length)
      ? day.selectedVilleIds
      : (day.villeId != null ? [day.villeId] : []);

    if (villeIds.length) {
      const villeNames = villeIds
        .map(id => this.villes.find(v => v.id === id))
        .filter((v): v is VilleDTO => !!v)
        .map(v => v.nom);


      if (villeNames.length) {
        baseList = baseList.filter(a => !!a.ville && villeNames.includes(a.ville));
      }
    }
    return baseList;
  }

  /** Activités autorisées pour le jour mais pas encore sélectionnées (colonne de gauche) */
  getAvailableActivitiesNotSelected(index: number): Activite[] {
    const allowed = this.getActivitiesForDay(index);
    const day = this.programmeDays[index];
    const selectedIds = new Set(day?.activities || []);
    return allowed.filter(a => !selectedIds.has(a.id));
  }

  /** Activités déjà sélectionnées pour le jour (colonne de droite) */
  getSelectedActivities(index: number): Activite[] {
    const day = this.programmeDays[index];
    if (!day || !day.activities || day.activities.length === 0) {
      return [];
    }
    const selectedIds = new Set(day.activities);
    return (this.availableActivites || []).filter(a => selectedIds.has(a.id));
  }

  /** Retourne les activités déjà sélectionnées pour le jour qui sont incompatibles avec la ville/zone */
  getSelectedIncompatibleActivities(index: number): Activite[] {
    const day = this.programmeDays[index];
    if (!day || !day.activities || day.activities.length === 0) return [];
    const allowed = this.getActivitiesForDay(index).map(a => a.id);
    const incompatibleIds = (day.activities || []).filter((aid: number) => allowed.indexOf(aid) === -1);
    return incompatibleIds.map((id: number) => this.availableActivites.find(a => a.id === id)).filter(Boolean) as Activite[];
  }

  removeIncompatibleActivities(index: number) {
    const day = this.programmeDays[index];
    if (!day || !day.activities) return;
    const allowed = this.getActivitiesForDay(index).map(a => a.id);
    day.activities = day.activities.filter(aid => allowed.indexOf(aid) !== -1);
  }

  onToggleActivity(dayIndex: number, activityId: number, event: Event) {
    const input = event.target as HTMLInputElement | null;
    const checked = !!input?.checked;
    const day = this.programmeDays[dayIndex];
    if (!day) return;
    if (!day.activities) {
      day.activities = [];
    }
    if (checked) {
      // Vérifier la compatibilité géographique avant d'ajouter
      const compatibilityCheck = this.checkGeographicCompatibility(dayIndex, activityId);
      if (!compatibilityCheck.compatible) {
        alert(`Impossible d'ajouter cette activité : ${compatibilityCheck.reason}`);
        // Remettre la checkbox à false
        if (input) input.checked = false;
        return;
      }
      if (!day.activities.includes(activityId)) {
        day.activities.push(activityId);
      }
    } else {
      day.activities = day.activities.filter(id => id !== activityId);
    }
    // mettre à jour cache pour cette journée
    this.recomputeDay(dayIndex);
  }

  removeActivity(dayIndex: number, activityId: number) {
    const day = this.programmeDays[dayIndex];
    if (!day || !day.activities) return;
    day.activities = day.activities.filter(id => id !== activityId);
    this.recomputeDay(dayIndex);
  }

  /**
   * Retourne le nom de la zone à partir de son id.
   * Si la zone n'est pas connue ou pas encore chargée,
   * on renvoie un libellé neutre "Zone non définie".
   */
  zoneName(zoneId?: number | null): string {
    if (zoneId == null) return 'Zone non définie';
    // 1) Vérifier le cache d'abord (peut être rempli par loadZones ou fetch à la demande)
    if (this.zoneNameCache && this.zoneNameCache[zoneId]) return this.zoneNameCache[zoneId];
    // 2) Puis la liste complète des zones si chargée
    const z = this.zones.find(x => x.id === zoneId);
    if (z && z.nom) {
      this.zoneNameCache[zoneId] = z.nom;
      return z.nom;
    }
    // 3) Si aucune info disponible, on essaie de lancer un fetch asynchrone
    this.ensureZoneNameCached(zoneId);
    // 4) fallback lisible
    return 'Zone non définie';
  }

  /**
   * Vérifie si une activité peut être ajoutée à un jour en fonction de la compatibilité géographique
   */
  checkGeographicCompatibility(dayIndex: number, activityId: number): { compatible: boolean; reason?: string } {
    const day = this.programmeDays[dayIndex];
    if (!day) return { compatible: false, reason: 'Jour introuvable' };

    const activity = this.availableActivites.find(a => a.id === activityId);
    if (!activity) {
      return { compatible: false, reason: 'Activité introuvable' };
    }

    const activityZoneName = this.zoneName(activity.zoneId);
    // Si la zone de l'activité est inconnue / non définie, on ne bloque pas
    if (!activityZoneName || activityZoneName === 'Zone non définie') {
      return { compatible: true };
    }

    // Si une zone unique est sélectionnée pour le jour, vérifier la compatibilité avec cette zone
    if (day.zoneId != null) {
      const dayZoneName = this.zoneName(day.zoneId);
      const allowedForDay = this.ZONE_COMPATIBILITY[dayZoneName] || [dayZoneName];
      if (!allowedForDay.includes(activityZoneName)) {
        return { compatible: false, reason: `L'activité appartient à "${activityZoneName}" et n'est pas compatible avec la zone du jour "${dayZoneName}".` };
      }
      // compatible with day's zone
      return { compatible: true };
    }

    // Sinon (pas de zone unique définie), utiliser la logique basée sur les activités déjà sélectionnées
    if (!day.activities || day.activities.length === 0) {
      // Premier activité du jour : toujours compatible
      return { compatible: true };
    }

    const existingZones = day.activities
      .map(aid => this.availableActivites.find(a => a.id === aid))
      .filter(a => a != null)
      .map(a => this.zoneName(a!.zoneId))
      .filter(zone => zone && zone !== 'Zone inconnue');

    for (const existingZone of existingZones) {
      const compatibleZones = this.ZONE_COMPATIBILITY[existingZone] || [];
      if (!compatibleZones.includes(activityZoneName)) {
        return {
          compatible: false,
          reason: `Impossible de combiner "${activityZoneName}" avec "${existingZone}". Les zones sont trop éloignées géographiquement.`
        };
      }
    }

    return { compatible: true };
  }

  /**
   * Vérifie s'il y a des avertissements de compatibilité géographique pour un jour
   */
  getGeographicCompatibilityWarnings(dayIndex: number): string[] {
    const day = this.programmeDays[dayIndex];
    if (!day || !day.activities || day.activities.length < 2) {
      return [];
    }

    const warnings: string[] = [];
    const activities = day.activities
      .map(aid => this.availableActivites.find(a => a.id === aid))
      .filter(a => a != null) as Activite[];

    // Grouper par zone
    const zonesInDay = [...new Set(activities.map(a => this.zoneName(a.zoneId)).filter(z => z && z !== 'Zone non définie'))];

    // Vérifier les combinaisons problématiques
    if (zonesInDay.includes('Sud') && zonesInDay.includes('Nord')) {
      warnings.push('⚠️ Attention : combiner Sud et Nord nécessite un long trajet (>400km)');
    }

    if (zonesInDay.length > 2) {
      warnings.push('⚠️ Plusieurs zones dans une journée : vérifier la faisabilité logistique');
    }

    return warnings;
  }

  // Helpers for grouping, recherche et affichage dans le template
  // (zoneName method removed here to avoid duplicate implementation)

  /** Noms des villes sélectionnées pour un jour (pour l'affichage des filtres) */
  getSelectedVilleNamesForDay(index: number): string[] {
    const day = this.programmeDays[index];
    if (!day) return [];

    const villeIds = (day.selectedVilleIds && day.selectedVilleIds.length)
      ? day.selectedVilleIds
      : (day.villeId != null ? [day.villeId] : []);

    if (!villeIds.length) return [];

    const names: string[] = [];
    for (const id of villeIds) {
      const v = this.villes.find(x => x.id === id);
      if (v && v.nom) {
        names.push(v.nom);
      }
    }
    return names;
  }

  /**
   * Si le nom de la zone n'est pas en cache, récupère la zone par id
   * et met à jour le `zoneNameCache` (appel asynchrone). Le template
   * se mettra à jour automatiquement quand la réponse arrivera.
   */
  private ensureZoneNameCached(zoneId: number) {
    if (zoneId == null) return;
    if (this.zoneNameCache[zoneId]) return; // déjà en cache
    // si la liste complète est déjà chargée, le cache devrait l'avoir; sinon on fait un appel
    this.zonesService.getById(zoneId).subscribe({
      next: (z) => {
        if (z && z.nom) {
          this.zoneNameCache[zoneId] = z.nom;
        }
      },
      error: (err) => {
        // ne pas spammer la console, mais logguer utilement
        console.warn('[AddCircuit] impossible de récupérer le nom de la zone', zoneId, err);
      }
    });
  }

  private villeNameById(villeId?: number | null): string {
    if (villeId == null) return '';
    const v = this.villes.find(x => x.id === villeId);
    return v ? v.nom : '';
  }

  /** Noms des zones sélectionnées pour un jour (pour affichage) */
  getSelectedZoneNamesForDay(index: number): string[] {
    const day = this.programmeDays[index];
    if (!day) return [];

    const zoneIds = (day.selectedZoneIds && day.selectedZoneIds.length)
      ? day.selectedZoneIds
      : (day.zoneId != null
          ? [day.zoneId]
          : (this.circuit.zoneId != null ? [this.circuit.zoneId] : []));

    if (!zoneIds.length) return [];

    return zoneIds.map(id => this.zoneName(id));
  }

  /** Indique si au moins une zone est sélectionnée pour le jour donné */
  hasSelectedZones(index: number): boolean {
    const day = this.programmeDays[index];
    return !!(day && day.selectedZoneIds && day.selectedZoneIds.length > 0);
  }

  /** Indique si aucune zone n'est sélectionnée pour le jour donné */
  hasNoSelectedZones(index: number): boolean {
    return !this.hasSelectedZones(index);
  }

  /** Retourne la liste d'activités disponibles (non sélectionnées) groupées par zone->ville
   *  Si `showAll` est vrai pour le jour on ignore le filtrage par zone/ville et on renvoie toutes les activités (hors sélectionnées).
   */
  // Legacy public getter kept for external uses, but prefer using computedGroups in template
  getAvailableActivitiesGrouped(index: number) {
    const day = this.programmeDays[index];
    if (!day) return [];
    // return computed if present
    return this.computedGroups[index] || [];
  }

  // Internal raw grouping logic used to build the computed groups when state changes
  private getAvailableActivitiesGroupedRaw(index: number) {
    const day = this.programmeDays[index];
    if (!day) return [];
    const showAll = !!this.showAllActivitiesForDay[index];
    let base = showAll ? (this.availableActivites || []) : this.getActivitiesForDay(index) || [];
    const selected = new Set(day.activities || []);
    base = base.filter(a => !selected.has(a.id));
    const q = (this.activityFilterText[index] || '').trim().toLowerCase();
    if (q) {
      base = base.filter(a => (a.nom || '').toLowerCase().includes(q) || (a.ville || '').toLowerCase().includes(q) || (a.type || '').toLowerCase().includes(q));
    }

    if (showAll) {
      // Quand on montre tout le catalogue, on ne groupe pas par zones : une seule liste plate
      return [{ zoneId: null, zoneKey: 'all', zoneName: '', villes: [], noVille: base }];
    }

    const mapZone = new Map<number|string, { zoneId?: number|null; zoneName?: string; villes: Map<string, Activite[]>; noVille: Activite[] }>();
    for (const a of base) {
      const zkey = a.zoneId != null ? a.zoneId : 'nogroup';
      if (!mapZone.has(zkey)) {
        const zId = typeof zkey === 'number' ? (zkey as number) : undefined;
        const zName = zId != null ? this.zoneName(zId) : (a.zone || 'Zone inconnue');
        mapZone.set(zkey, { zoneId: typeof zkey === 'number' ? zkey : undefined, zoneName: zName, villes: new Map(), noVille: [] });
      }
      const zoneEntry = mapZone.get(zkey)!;
      const villeName = a.ville ?? '';
      if (villeName) {
        if (!zoneEntry.villes.has(villeName)) zoneEntry.villes.set(villeName, []);
        zoneEntry.villes.get(villeName)!.push(a);
      } else {
        zoneEntry.noVille.push(a);
      }
    }
    const groups: Array<any> = [];
    for (const [, val] of mapZone) {
      const villesArr: Array<any> = [];
      for (const [vn, acts] of val.villes) {
        villesArr.push({ villeName: vn, activities: acts });
      }
      villesArr.sort((a, b) => (a.villeName || '').localeCompare(b.villeName || ''));
      const zoneKey = val.zoneId != null ? 'z_' + val.zoneId : 'nogroup';
      groups.push({ zoneId: val.zoneId, zoneKey: zoneKey, zoneName: val.zoneName, villes: villesArr, noVille: val.noVille });
    }
    groups.sort((a, b) => (a.zoneName || '').localeCompare(b.zoneName || ''));
    return groups;
  }

  getGroupActivityCount(dayIndex: number, group: any): number {
    let c = 0;
    if (!group) return 0;
    if (group.villes && group.villes.length) {
      for (const v of group.villes) c += (v.activities || []).length;
    }
    if (group.noVille) c += group.noVille.length;
    return c;
  }

  toggleGroup(dayIndex: number, zoneKey: string) {
    if (!this.expandedZoneState[dayIndex]) this.expandedZoneState[dayIndex] = {};
    const cur = !!this.expandedZoneState[dayIndex][zoneKey];
    this.expandedZoneState[dayIndex][zoneKey] = !cur;
  }

  isGroupExpanded(dayIndex: number, zoneKey: string): boolean {
    // default: expanded when not explicitly set? we'll default to false for compactness
    if (!this.expandedZoneState[dayIndex]) return false;
    // Pour le catalogue complet, forcer l'expansion
    if (zoneKey === 'all') return true;
    return !!this.expandedZoneState[dayIndex][zoneKey];
  }

  /** Sélectionner/désélectionner toutes les activités d'un groupe */
  selectAllActivitiesInGroup(dayIndex: number, group: any, event: Event) {
    event.stopPropagation(); // empêcher le toggle du groupe
    const day = this.programmeDays[dayIndex];
    if (!day) return;

    const allActivitiesInGroup = this.getAllActivitiesInGroup(group);
    const allSelected = allActivitiesInGroup.every(act => this.isActivitySelected(dayIndex, act.id));

    if (allSelected) {
      // Désélectionner tout
      allActivitiesInGroup.forEach(act => {
        const index = day.activities?.indexOf(act.id);
        if (index !== undefined && index >= 0) {
          day.activities?.splice(index, 1);
        }
      });
    } else {
      // Sélectionner tout
      if (!day.activities) day.activities = [];
      allActivitiesInGroup.forEach(act => {
        if (!day.activities?.includes(act.id)) {
          day.activities?.push(act.id);
        }
      });
    }
  }

  /** Récupérer toutes les activités d'un groupe (noVille + villes) */
  getAllActivitiesInGroup(group: any): Activite[] {
    let activities: Activite[] = [...(group.noVille || [])];
    if (group.villes) {
      group.villes.forEach((villeGroup: any) => {
        activities = activities.concat(villeGroup.activities || []);
      });
    }
    return activities;
  }

  /** Vérifier si une activité est sélectionnée pour un jour */
  isActivitySelected(dayIndex: number, activityId: number): boolean {
    const day = this.programmeDays[dayIndex];
    return !!(day?.activities?.includes(activityId));
  }

  /** Basculer l'expansion d'un jour dans l'accordéon */
  toggleDayExpansion(dayIndex: number): void {
    this.dayExpanded[dayIndex] = !this.dayExpanded[dayIndex];
  }

  // Sélection d'une zone unique pour un jour
  onDayZoneSelectChange(dayIndex: number, zoneId: number | null) {
    const day = this.programmeDays[dayIndex];
    if (!day) return;
    // Mémoriser la zone choisie
    day.zoneId = zoneId ?? null;
    // Garder selectedZoneIds pour compatibilité interne
    day.selectedZoneIds = zoneId != null ? [zoneId] : [];

    // Nettoyer les villes qui ne sont plus dans la zone sélectionnée
    if (day.selectedVilleIds && day.selectedVilleIds.length && zoneId != null) {
      const allowedVilleIds = this.villes
        .filter((v: VilleDTO) => v.zoneId != null && v.zoneId === zoneId)
        .map((v: VilleDTO) => v.id);
      day.selectedVilleIds = day.selectedVilleIds.filter((id: number) => allowedVilleIds.includes(id));
    }

    // recompute caches
    this.recomputeDay(dayIndex);

    // si des activités deviennent incompatibles, demander confirmation avant suppression
    const incompatible = this.getSelectedIncompatibleActivities(dayIndex);
    if (incompatible && incompatible.length) {
      const names = incompatible.map(a => a.nom).join(', ');
      const confirmRemove = confirm(`Les activités suivantes ne sont plus compatibles avec la zone sélectionnée : ${names}. Voulez-vous les retirer ?`);
      if (confirmRemove) {
        this.removeIncompatibleActivities(dayIndex);
        this.recomputeDay(dayIndex);
      }
    }
  }

  onToggleDayVille(dayIndex: number, villeId: number, eventOrChecked: Event | boolean) {
    const checked = typeof eventOrChecked === 'boolean' ? eventOrChecked : !!((eventOrChecked as Event).target as HTMLInputElement)?.checked;
    const day = this.programmeDays[dayIndex];
    if (!day) return;

    if (!day.selectedVilleIds) {
      day.selectedVilleIds = [];
    }

    if (checked) {
      if (!day.selectedVilleIds.includes(villeId)) {
        day.selectedVilleIds.push(villeId);
      }
    } else {
      day.selectedVilleIds = day.selectedVilleIds.filter(id => id !== villeId);
    }
    this.recomputeDay(dayIndex);
  }

  loadZones() {
    this.zonesService.getAll().subscribe({
      next: (zones) => {
        // Normaliser la forme des zones pour garantir la présence d'un `id`
        const normalized = (zones || []).map((raw: any) => {
          const id = raw?.id ?? raw?.zoneId ?? raw?.zone_id;
          return { ...raw, id };
        });

        this.zones = normalized;

        // remplir le cache immédiatement pour accélérer l'affichage
        for (const z of normalized) {
          if (z && z.id != null && z.nom) this.zoneNameCache[z.id] = z.nom;
        }

        // recompute caches as zones (names) may have changed
        this.recomputeAllDays();
      },
      error: (error) => {
        console.error('Erreur chargement zones', error);
      }
    });
  }

  loadVilles() {
    this.villesService.getAll().subscribe({
      next: (villes) => {
        this.villes = villes;
        // recompute caches as available villes changed
        this.recomputeAllDays();
      },
      error: (error) => {
        console.error('Erreur chargement villes', error);
      }
    });
  }

  /**
   * Synchronise automatiquement le nombre de jours du programme
   * avec la durée choisie à l'étape 1 (1 jour, 3 jours, 1 semaine, etc.).
   */
  onDureeChange(value: string) {
    this.circuit.dureeIndicative = value;
    const targetDays = this.computeDaysFromDuree(value);
    if (!targetDays || targetDays <= 0) {
      return;
    }

    // Allonger ou réduire le tableau programmeDays pour coller au nombre de jours
    if (this.programmeDays.length < targetDays) {
      for (let d = this.programmeDays.length + 1; d <= targetDays; d++) {
        this.programmeDays.push({
          day: d,
          zoneId: this.circuit.zoneId ?? null,
          villeId: null,
          selectedZoneIds: this.circuit.zoneId != null ? [this.circuit.zoneId] : [],
          selectedVilleIds: [],
          activities: [],
          notes: ''
        });
        this.activityFilterText.push('');
        this.showAllActivitiesForDay.push(false);
        this.expandedZoneState.push({});
      }
    } else if (this.programmeDays.length > targetDays) {
      this.programmeDays = this.programmeDays.slice(0, targetDays);
      this.activityFilterText = this.activityFilterText.slice(0, targetDays);
      this.showAllActivitiesForDay = this.showAllActivitiesForDay.slice(0, targetDays);
      this.expandedZoneState = this.expandedZoneState.slice(0, targetDays);
    }

    // Re-numéroter proprement les jours
    this.programmeDays.forEach((day, idx) => day.day = idx + 1);
  }

  private computeDaysFromDuree(duree: string | null | undefined): number {
    if (!duree) return 0;
    const val = duree.toLowerCase().trim();
    // Cas "X jours"
    const joursMatch = val.match(/(\d+)\s*jour/);
    if (joursMatch) {
      const n = parseInt(joursMatch[1], 10);
      if (!isNaN(n) && n > 0) return n;
    }
    // Cas "X semaine(s)"
    const semMatch = val.match(/(\d+)\s*semaine/);
    if (semMatch) {
      const n = parseInt(semMatch[1], 10);
      if (!isNaN(n) && n > 0) return n * 7;
    }
    // Cas "1 mois" -> approx 30 jours
    if (val.includes('mois')) {
      return 30;
    }
    return 0;
  }

  goToStep(step: number) {
    // allow direct go only if target is previous or current; if forward, validate intermediate
    if (step > this.currentStep) {
      // validate current step before moving forward
      if (this.currentStep === 1) {
        const ok = this.validateStep1();
        if (!ok) { this.showErrorsStep1 = true; return; }
      }
      if (this.currentStep === 2) {
        const ok2 = this.validateStep2();
        if (!ok2) { this.showErrorsStep2 = true; return; }
      }
      if (this.currentStep === 3) {
        const ok3 = this.validateStep3();
        if (!ok3) { this.showErrorsStep3 = true; return; }
      }
    }
    this.currentStep = step;
  }

  nextStep() {
    if (this.currentStep < 4) {
      if (this.currentStep === 1) {
        const ok = this.validateStep1();
        if (!ok) { this.showErrorsStep1 = true; return; }
        this.showErrorsStep1 = false;
      } else if (this.currentStep === 2) {
        const ok2 = this.validateStep2();
        if (!ok2) { this.showErrorsStep2 = true; return; }
        this.showErrorsStep2 = false;
      } else if (this.currentStep === 3) {
        const ok3 = this.validateStep3();
        if (!ok3) { this.showErrorsStep3 = true; return; }
        this.showErrorsStep3 = false;
      }
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Gestion des images
  onHeroImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.heroImageFile = file;
      // optionally keep a preview: convert to base64 for preview only
      this.convertFileToBase64(file).then(base64 => {
        this.heroPreview = base64;
      }).catch(() => { this.heroPreview = null; });
    }
  }

  onGalerieImagesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    if (files.length >= 3 && files.length <= 10) {
      this.galerieFiles = files;
      this.showErrorsStep3 = false;
      // generate previews
      this.galeriePreviews = [];
      Promise.all(files.slice(0, 10).map(f => this.convertFileToBase64(f).catch(() => null)))
        .then(previews => {
          this.galeriePreviews = previews.filter(Boolean) as string[];
        }).catch(() => { this.galeriePreviews = []; });
    } else {
      this.galerieFiles = [];
      this.showErrorsStep3 = true;
      // keep native alert for immediate feedback
      alert('Veuillez sélectionner entre 3 et 10 images.');
      event.target.value = '';
    }
  }

  // Méthode utilitaire pour convertir un fichier en base64
  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Gestion du programme jour par jour
  addJour() {
    const nextDay = this.programmeDays.length + 1;
    this.programmeDays.push({
      day: nextDay,
      zoneId: this.circuit.zoneId ?? null,
      villeId: null,
      selectedZoneIds: this.circuit.zoneId != null ? [this.circuit.zoneId] : [],
      selectedVilleIds: [],
      activities: [],
      notes: ''
    });
    this.activityFilterText.push('');
    this.showAllActivitiesForDay.push(false);
    this.compactView.push(false);
    this.dayExpanded.push(true);
    this.expandedZoneState.push({});
    // keep computed arrays in sync and compute for the new day
    this.computedGroups.push([]);
    this.computedSelectedActivities.push([]);
    this.computedVillesPerDay.push([]);
    this.recomputeDay(this.programmeDays.length - 1);
  }

  

  removeJour(index: number) {
    if (this.programmeDays.length > 1) {
      this.programmeDays.splice(index, 1);
      // re-number days
      this.programmeDays.forEach((d, i) => d.day = i + 1);
      this.activityFilterText.splice(index, 1);
      this.showAllActivitiesForDay.splice(index, 1);
      this.compactView.splice(index, 1);
      this.dayExpanded.splice(index, 1);
      this.expandedZoneState.splice(index, 1);
      // keep computed arrays in sync
      this.computedGroups.splice(index, 1);
      this.computedSelectedActivities.splice(index, 1);
      this.computedVillesPerDay.splice(index, 1);
      // recompute remaining days to ensure state is consistent
      this.recomputeAllDays();
    }
  }

  // Gestion tourisme / aventures
  addTourisme() {
    this.circuit.tourisme!.push('');
  }

  removeTourisme(index: number) {
    if (this.circuit.tourisme!.length > 1) {
      this.circuit.tourisme!.splice(index, 1);
    }
  }

  addAventure() {
    this.circuit.aventures!.push('');
  }

  removeAventure(index: number) {
    if (this.circuit.aventures!.length > 1) {
      this.circuit.aventures!.splice(index, 1);
    }
  }

  // Gestion des points forts
  addPointFort() {
    this.circuit.pointsForts.push({ icon: '', title: '', desc: '' });
  }

  addPredefinedPointFort(point: { icon: string, title: string, desc: string }) {
    this.circuit.pointsForts.push({ ...point });
  }

  removePointFort(index: number) {
    if (this.circuit.pointsForts.length > 1) {
      this.circuit.pointsForts.splice(index, 1);
    }
  }

  // Gestion des éléments inclus
  addInclus() {
    this.circuit.inclus!.push('');
  }

  removeInclus(index: number) {
    if (this.circuit.inclus!.length > 1) {
      this.circuit.inclus!.splice(index, 1);
    }
  }

  // Gestion des éléments non inclus
  addNonInclus() {
    this.circuit.nonInclus!.push('');
  }

  removeNonInclus(index: number) {
    if (this.circuit.nonInclus!.length > 1) {
      this.circuit.nonInclus!.splice(index, 1);
    }
  }

  // Utilitaire pour le tracking des arrays
  trackByIndex(index: number): number {
    return index;
  }

  trackByZoneId(index: number, zone: Zone): number {
    return zone.id;
  }

  // Validation par étape
  private validateStep1(): boolean {
    const titre = (this.circuit.titre || '').toString().trim();
    const description = (this.circuit.description || '').toString().trim();
    // accept both property names if present (legacy/different bindings)
    const dureeVal = (this.circuit.dureeIndicative ?? (this.circuit as any).duree) || '';
    const duree = dureeVal.toString().trim();
    const prixVal = Number(this.circuit.prixIndicatif);
    const prixOk = !isNaN(prixVal) && prixVal > 0;

    const okTitre = titre.length > 0;
    const okDescription = description.length > 0;
    const okDuree = duree.length > 0;
    const okPrix = prixOk;
    const result = okTitre && okDescription && okDuree && okPrix;

    // debug log


    return result;
  }

  // helper to return a small debug object for template logs
  private getStep1Debug() {
    return {
      titre: this.circuit.titre,
      descriptionLen: this.circuit.description ? this.circuit.description.length : 0,
      duree: this.circuit.dureeIndicative,
      prix: this.circuit.prixIndicatif,
      villeId: this.circuit.villeId
    };
  }

  // Exposé au template : indique si le prix est invalide
  isPrixInvalid(): boolean {
    return !(this.circuit.prixIndicatif != null && !isNaN(Number(this.circuit.prixIndicatif)) && Number(this.circuit.prixIndicatif) > 0);
  }

  // Villes filtrées par la zone principale choisie à l'étape 1
  getVillesForCurrentZone(): VilleDTO[] {
    if (!this.circuit.zoneId) {
      return this.villes;
    }
    return this.villes.filter(v => v.zoneId === this.circuit.zoneId);
  }

  // Helper pour afficher le prix converti dans le template
  // - Si `saisirEnCFA` est coché, l'administrateur saisit en XOF => on affiche l'équivalent en EUR
  // - Sinon, on affiche la valeur en XOF (conversion depuis EUR)
  displayPrice(): number {
    if (this.circuit.prixIndicatif == null) return 0;
    const val = Number(this.circuit.prixIndicatif);
    if (isNaN(val)) return 0;
    try {
      if (this.saisirEnCFA) {
        // prixIndicatif contient XOF, afficher EUR
        return val / this.RATE_XOF_PER_EUR;
      }
      // prixIndicatif contient EUR, afficher XOF
      return val * this.RATE_XOF_PER_EUR;
    } catch (e) {
      return 0;
    }
  }

  // Retourne le prix formaté avec unité (évite les expressions complexes dans le template)
  displayPriceFormatted(): string {
    const v = this.displayPrice();
    if (this.saisirEnCFA) {
      return v.toFixed(2) + ' €';
    }
    return Math.round(v).toString() + ' XOF';
  }

  private validateStep2(): boolean {
    // Étape 2 : programme (jours + au moins une activité sélectionnée sur l'ensemble du séjour)
    const hasDays = this.programmeDays && this.programmeDays.length > 0;
    const hasAnyActivity = hasDays && this.programmeDays.some(p => p.activities && p.activities.length > 0);
    const result = hasDays && hasAnyActivity;
    return result;
  }

  private validateStep3(): boolean {
    // Étape 3 : images (hero + galerie)
    const okHero = !!this.heroImageFile;
    const okGalerie = this.galerieFiles && this.galerieFiles.length >= 3 && this.galerieFiles.length <= 10;
    const result = okHero && okGalerie;
    return result;
  }

  onSubmit() {


    // Nettoyage: supprimer les points forts complètement vides (utilisateur n'a pas rempli les champs)
    if (this.circuit.pointsForts && this.circuit.pointsForts.length > 0) {
      this.circuit.pointsForts = this.circuit.pointsForts.filter(p => {
        const icon = (p.icon || '').toString().trim();
        const title = (p.title || '').toString().trim();
        const desc = (p.desc || '').toString().trim();
        // on garde uniquement les points où au moins un champ est renseigné
        return icon !== '' || title !== '' || desc !== '';
      });
    }

    // Validation des champs obligatoires (assurer que step1/2 sont valides avant submit)
    if (!this.validateStep1()) {
      this.showErrorsStep1 = true;
      this.currentStep = 1;
      return;
    }
    if (!this.validateStep2()) {
      this.showErrorsStep2 = true;
      this.currentStep = 2;
      return;
    }
    if (!this.validateStep3()) {
      this.showErrorsStep3 = true;
      this.currentStep = 3;
      return;
    }

    // Validation des images
    if (!this.heroImageFile) {
      alert('Veuillez sélectionner une image principale.');
      console.error('Image principale manquante');
      return;
    }

    if (this.galerieFiles.length < 3 || this.galerieFiles.length > 10) {
      alert('Veuillez sélectionner entre 3 et 10 images pour la galerie.');
      console.error('Nombre d\'images galerie invalide:', this.galerieFiles.length);
      return;
    }

    // Programme : on a déjà validé l'étape 2, pas besoin d'imposer une description texte

    // Validation tourisme / aventures (optionnel mais nettoyer les entrées vides)
    if (this.circuit.tourisme && this.circuit.tourisme.length > 0) {
      this.circuit.tourisme = this.circuit.tourisme.filter(t => t && t.toString().trim() !== '');
    }
    if (this.circuit.aventures && this.circuit.aventures.length > 0) {
      this.circuit.aventures = this.circuit.aventures.filter(a => a && a.toString().trim() !== '');
    }

    // Validation des points forts: il doit y avoir au moins 1 point fort complet
    if (!this.circuit.pointsForts || this.circuit.pointsForts.length === 0) {
      alert('Veuillez ajouter au moins un point fort (icône, titre et description).');
      console.error('Aucun point fort renseigné');
      return;
    }
    // Vérifier que tous les points fournis sont complets
    if (this.circuit.pointsForts.some(point => !point.icon || !point.icon.toString().trim() || !point.title || !point.title.toString().trim() || !point.desc || !point.desc.toString().trim())) {
      alert('Veuillez remplir tous les champs des points forts (icône, titre et description).');
      console.error('Points forts incomplets');
      return;
    }

    // Validation des inclusions
    if (this.circuit.inclus.some(item => !item.trim())) {
      alert('Veuillez remplir tous les éléments inclus.');
      console.error('Inclus incomplets');
      return;
    }

    if (this.circuit.nonInclus.some(item => !item.trim())) {
      alert('Veuillez remplir tous les éléments non inclus.');
      console.error('Non inclus incomplets');
      return;
    }

    this.isLoading = true;

    (async () => {
      try {
        // 1) uploader l'image principale
        if (!this.heroImageFile) throw new Error('Image principale manquante');
        const heroResp = await lastValueFrom(this.circuitService.uploadImage(this.heroImageFile, 'circuits/hero'));
        // backend retourne { filename, url }
        this.circuit.img = heroResp.url;

        // 2) uploader la galerie en parallèle
        const galerieResults: Array<{ filename: string; url: string }> = [];
        const failedFiles: Array<{ name: string; error: any }> = [];
        for (const file of this.galerieFiles) {
          try {
            const r = await lastValueFrom(this.circuitService.uploadImage(file, 'circuits/galerie'));
            galerieResults.push(r);
          } catch (uploadErr) {
            console.error('[AddCircuit] gallery upload failed for', file.name, uploadErr);
            failedFiles.push({ name: file.name, error: uploadErr });
          }
        }

        // If some uploads failed, inform the user but continue with the successful ones
        if (failedFiles.length > 0) {
          const names = failedFiles.map(f => f.name).join(', ');
          alert('Certaines images de la galerie n\'ont pas pu être uploadées: ' + names + '. Le circuit sera créé avec les images uploadées. Vous pouvez réessayer pour les fichiers manquants.');
        }

        this.circuit.galerie = galerieResults.map(r => r.url);

        // 3) créer le circuit avec les URLs complètes

        // Si l'admin a saisi le prix en XOF (CFA), convertir en EUR avant l'envoi
        if (this.saisirEnCFA && this.circuit.prixIndicatif != null && !isNaN(Number(this.circuit.prixIndicatif))) {
          try {
            this.circuit.prixIndicatif = Number(Number(this.circuit.prixIndicatif) / this.RATE_XOF_PER_EUR);
          } catch (e) {
            console.warn('Conversion prix XOF->EUR failed', e);
          }
        }

        // Programme structuré : mapper vers le format attendu par le backend (ProgrammeDay)
        // -> seulement day, description, approxTime, mealsIncluded, activities
        this.circuit.programme = this.programmeDays.map(d => ({
          day: d.day,
          description: (d.notes || '').toString().trim(),
          approxTime: null,
          mealsIncluded: [] as string[],
          activities: d.activities || []
        }) as any);

        // Remplir activiteIds du circuit à partir des activités choisies dans le programme
        if (this.programmeDays && this.programmeDays.length > 0) {
          const allActs = this.programmeDays.flatMap(d => d.activities || []);
          this.circuit.activiteIds = Array.from(new Set(allActs));
        }

        this.circuitService.createCircuit(this.circuit as Omit<CircuitDTO, 'id'>).subscribe({
          next: (createdCircuit) => {
            this.router.navigate(['/admin/circuits']);
          },
          error: (error) => {
            console.error('[AddCircuit] Erreur création circuit', error);
            alert('Erreur lors de la création du circuit. Veuillez réessayer.');
            this.isLoading = false;
          }
        });

      } catch (err: any) {
        console.error('Erreur lors de l\'upload des images:', err);
        alert('Erreur lors de l\'upload des images : ' + (err.message || err));
        this.isLoading = false;
      }
    })();
  }

  cancel() {
    this.router.navigate(['/admin/circuits']);
  }
}