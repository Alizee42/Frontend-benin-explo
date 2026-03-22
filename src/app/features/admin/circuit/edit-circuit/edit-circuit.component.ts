import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { BeButtonComponent } from '../../../../shared/components/be-button/be-button.component';
import { CircuitDTO } from '../../../../models/circuit.dto';
import { CircuitService } from '../../../../services/circuit.service';
import { CircuitFormCacheService } from '../../../../services/circuit-form-cache.service';
import { ZoneDTO } from '../../../../services/zones-admin.service';
import { VilleDTO } from '../../../../services/villes.service';
import { Activite } from '../../../../services/activites.service';
import { lastValueFrom } from 'rxjs';
import { EUR_TO_XOF_RATE } from '../../../../shared/constants/currency.constants';

@Component({
  selector: 'app-edit-circuit',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, BeButtonComponent],
  templateUrl: './edit-circuit.component.html',
  styleUrls: ['./edit-circuit.component.scss', '../add-circuit/add-circuit.component.scss']
})
export class EditCircuitComponent implements OnInit, OnDestroy {
  // Taux fixe approximatif EUR <-> XOF (1 EUR = 655.957 XOF)
  readonly RATE_XOF_PER_EUR = EUR_TO_XOF_RATE_RATE;
  // ============================================
  // MODÈLE DE DONNÉES (IDENTIQUE À ADD)
  // ============================================

  circuit = {
    // Informations de base
    titre: '',
    description: '',
    dureeJours: 1,
    prixEuros: 0,

    // Images
    imageHero: null as File | null,
    imagesGalerie: [] as File[],

    // Programme (structure enrichie avec ville/zone par jour)
    programme: [] as Array<{
      jour: number;
      title?: string;
      description: string;
      zoneId: number | null;
      villeId: number | null;
      activiteIds: number[];
    }>,

    // Points forts
    pointsForts: [{ icon: '🏛️', title: '', desc: '' }] as Array<{icon: string, title: string, desc: string}>,

    // Inclus/Non inclus
    inclus: [''],
    nonInclus: ['']
  };

  // ============================================
  // DONNÉES DE RÉFÉRENCE
  // ============================================

  zones: ZoneDTO[] = [];
  villes: VilleDTO[] = [];
  activites: Activite[] = [];

  activitesParJour: { [jourIndex: number]: Activite[] } = {};
  villesParJour: { [jourIndex: number]: VilleDTO[] } = {};

  loading = {
    zones: false,
    villes: false,
    activites: false,
    submit: false
  };

  // ============================================
  // ÉTAT DE L'INTERFACE
  // ============================================

  currentStep = 1;
  totalSteps = 4;
  activeDayIndex = 0;
  step4Section: 'highlights' | 'inclusions' = 'highlights';
  priceCurrency: 'EUR' | 'XOF' = 'EUR';
  private lastPriceCurrency: 'EUR' | 'XOF' = 'EUR';

  previewHero: string | null = null;
  previewsGalerie: string[] = [];

  errors: { [key: string]: string } = {};
  programmeMissingDetails: Array<{ jour: number; missing: string[] }> = [];

  // ============================================
  // BROUILLON (AUTO-SAVE)
  // ============================================

  private readonly DRAFT_KEY_PREFIX = 'be_circuit_edit_draft_';
  private readonly AUTOSAVE_MS = 4000;
  private autosaveTimer: number | null = null;
  draftAvailable = false;
  draftRestored = false;
  lastAutoSaveAt: number | null = null;
  draftSavedAt: number | null = null;
  manualSaveNotice = false;

  // ============================================
  // ÉDITION
  // ============================================

  circuitId: string | null = null;
  circuitDto: CircuitDTO | null = null;
  isLoading = false;
  existingHeroUrl: string | null = null;
  existingGalerieUrls: string[] = [];

  // Points forts prédéfinis
  predefinedPointsForts = [
    { icon: '🏛️', title: 'Histoire & Culture', desc: 'Découvrez le riche patrimoine historique et culturel du Bénin' },
    { icon: '🌿', title: 'Nature & Écologie', desc: 'Explorez la biodiversité exceptionnelle et les écosystèmes préservés' },
    { icon: '🍲', title: 'Gastronomie locale', desc: 'Dégustez les saveurs authentiques de la cuisine béninoise' },
    { icon: '🏖️', title: 'Plages & Détente', desc: 'Profitez des côtes magnifiques et des moments de relaxation' },
    { icon: '🏞️', title: 'Paysages exceptionnels', desc: 'Admirez des panoramas à couper le souffle' },
    { icon: '🎭', title: 'Traditions vivantes', desc: 'Immergez-vous dans les coutumes et rituels ancestraux' },
    { icon: '🎨', title: 'Artisanat local', desc: 'Découvrez l\'artisanat traditionnel et les savoir-faire ancestraux' },
    { icon: '🏊‍♂️', title: 'Activités aquatiques', desc: 'Profitez des sports nautiques et activités aquatiques' },
    { icon: '📸', title: 'Photographie', desc: 'Capturer des moments uniques dans des décors exceptionnels' },
    { icon: '👥', title: 'Rencontres humaines', desc: 'Échangez avec les populations locales et partagez leur quotidien' }
  ];

  private readonly pointIconMap: Record<string, string> = {
    HISTOIRE: '🏛️',
    NATURE: '🌿',
    GASTRO: '🍲',
    PLAGES: '🏖️',
    PAYSAGES: '🏞️',
    TRADITIONS: '🎭',
    ARTISANAT: '🎨',
    AQUATIQUE: '🏊‍♂️',
    PHOTO: '📸',
    RENCONTRES: '👥'
  };

  constructor(
    private circuitService: CircuitService,
    private cacheService: CircuitFormCacheService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.circuitId = this.route.snapshot.paramMap.get('id');
    this.initProgramme();
    this.loadZones();
    this.checkDraft();
    this.startAutoSave();

    if (this.circuitId) {
      this.loadCircuit();
    }
  }

  ngOnDestroy() {
    if (this.autosaveTimer) {
      window.clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  // ============================================
  // INITIALISATION
  // ============================================

  private initProgramme() {
    this.circuit.programme = [{
      jour: 1,
      description: '',
      zoneId: null,
      villeId: null,
      activiteIds: []
    }];
  }

  // ============================================
  // CHARGEMENT DES DONNÉES
  // ============================================

  private loadZones() {
    this.loading.zones = true;
    this.cacheService.getZones().subscribe({
      next: (zones) => {
        this.zones = zones;
        this.loading.zones = false;
      },
      error: () => {
        this.loading.zones = false;
        this.errors['zones'] = 'Impossible de charger les zones';
      }
    });
  }

  private loadCircuit() {
    if (!this.circuitId) return;

    this.isLoading = true;
    this.circuitService.getCircuitById(+this.circuitId).subscribe({
      next: (dto) => {
        this.circuitDto = dto;
        this.populateFormFromDto(dto);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement circuit', error);
        this.isLoading = false;
        this.router.navigate(['/admin/circuits']);
      }
    });
  }

  private populateFormFromDto(dto: CircuitDTO) {
    this.circuit.titre = dto.titre || '';
    this.circuit.description = dto.description || '';
    this.circuit.dureeJours = this.extractDureeJours(dto.dureeIndicative);
    this.circuit.prixEuros = Number(dto.prixIndicatif || 0);

    this.circuit.pointsForts = dto.pointsForts && dto.pointsForts.length > 0
      ? dto.pointsForts.map(p => ({
          icon: this.normalizePointIcon(p.icon),
          title: p.title || '',
          desc: p.desc || ''
        }))
      : [{ icon: '🏛️', title: '', desc: '' }];

    this.circuit.inclus = dto.inclus && dto.inclus.length > 0 ? dto.inclus : [''];
    this.circuit.nonInclus = dto.nonInclus && dto.nonInclus.length > 0 ? dto.nonInclus : [''];

    this.circuit.programme = this.buildProgrammeFromDto(dto);
    if (this.circuit.programme.length === 0) {
      this.initProgramme();
    }

    this.circuit.dureeJours = this.circuit.programme.length || this.circuit.dureeJours || 1;
    this.activeDayIndex = Math.min(this.activeDayIndex, this.circuit.programme.length - 1);

    this.existingHeroUrl = dto.img || null;
    this.existingGalerieUrls = Array.isArray(dto.galerie) ? dto.galerie : [];

    this.hydrateProgrammeCaches();
  }

  private buildProgrammeFromDto(dto: CircuitDTO) {
    if (!dto.programme || dto.programme.length === 0) return [] as Array<{jour: number; description: string; zoneId: number | null; villeId: number | null; activiteIds: number[]}>;

    return dto.programme.map((p: any, idx: number) => {
      if (typeof p === 'string') {
        return {
          jour: idx + 1,
          title: '',
          description: p,
          zoneId: dto.zoneId ?? null,
          villeId: dto.villeId ?? null,
          activiteIds: []
        };
      }
      return {
        jour: p.day ?? idx + 1,
        title: p.title ?? '',
        description: (p.description ?? p.notes ?? '').toString(),
        zoneId: p.zoneId ?? dto.zoneId ?? null,
        villeId: p.villeId ?? dto.villeId ?? null,
        activiteIds: p.activities ?? p.activiteIds ?? []
      };
    });
  }

  private hydrateProgrammeCaches() {
    this.circuit.programme.forEach((jour, index) => {
      if (!jour.zoneId) return;

      this.cacheService.getVillesForZone(jour.zoneId).subscribe({
        next: (villes) => {
          this.villesParJour = { ...this.villesParJour, [index]: villes };
        },
        error: () => {
          this.villesParJour = { ...this.villesParJour, [index]: [] };
        }
      });

      this.cacheService.getActivitesForZone(jour.zoneId).subscribe({
        next: (activites) => {
          this.activitesParJour = { ...this.activitesParJour, [index]: activites };
          jour.activiteIds = jour.activiteIds.filter(id => activites.some(act => act.id === id));
        },
        error: () => {
          this.activitesParJour = { ...this.activitesParJour, [index]: [] };
        }
      });
    });
  }

  private extractDureeJours(dureeIndicative: string | null | undefined): number {
    if (!dureeIndicative) return 1;
    const normalized = dureeIndicative.toLowerCase();
    const numMatch = normalized.match(/\d+/);
    const number = numMatch ? Number(numMatch[0]) : 1;

    if (normalized.includes('semaine')) {
      return number * 7;
    }
    if (normalized.includes('mois')) {
      return number * 30;
    }
    return number;
  }

  // ============================================
  // GESTION DES DONNÉES DE RÉFÉRENCE
  // ============================================

  onJourZoneChange(jourIndex: number) {
    const jour = this.circuit.programme[jourIndex];
    jour.villeId = null;

    if (!jour.zoneId) {
      this.villesParJour = { ...this.villesParJour };
      delete this.villesParJour[jourIndex];
      this.activitesParJour = { ...this.activitesParJour };
      delete this.activitesParJour[jourIndex];
      return;
    }

    this.cacheService.getVillesForZone(jour.zoneId).subscribe({
      next: (villes) => {
        this.villesParJour = { ...this.villesParJour, [jourIndex]: villes };
      },
      error: () => {
        this.villesParJour = { ...this.villesParJour, [jourIndex]: [] };
      }
    });

    this.cacheService.getActivitesForZone(jour.zoneId).subscribe({
      next: (activites) => {
        this.activitesParJour = { ...this.activitesParJour, [jourIndex]: activites };
        jour.activiteIds = jour.activiteIds.filter(id => activites.some(act => act.id === id));
      },
      error: () => {
        this.activitesParJour = { ...this.activitesParJour, [jourIndex]: [] };
      }
    });
  }

  onJourVilleChange(jourIndex: number) {
    const jour = this.circuit.programme[jourIndex];
    const activitesDisponibles = this.getActivitesForJour(jourIndex);
    jour.activiteIds = jour.activiteIds.filter(id =>
      activitesDisponibles.some(act => act.id === id)
    );
  }

  getVillesForJour(jourIndex: number): VilleDTO[] {
    return this.villesParJour[jourIndex] || [];
  }

  getActivitesForJour(jourIndex: number): Activite[] {
    const jour = this.circuit.programme[jourIndex];
    let activites = this.activitesParJour[jourIndex] || [];

    if (jour.villeId) {
      activites = activites.filter(act => act.villeId === jour.villeId);
    }

    activites.forEach(act => {
      if (act.dureeInterne && !act.dureeDisplay) {
        act.dureeDisplay = this.formatDuree(act.dureeInterne);
      }
    });

    return activites;
  }

  private formatDuree(minutes: number): string {
    const heures = Math.floor(minutes / 60);
    const minutesRestantes = minutes % 60;

    if (heures === 0) {
      return `${minutesRestantes}min`;
    } else if (minutesRestantes === 0) {
      return `${heures}h`;
    } else {
      return `${heures}h${minutesRestantes.toString().padStart(2, '0')}`;
    }
  }

  isLoadingVillesForJour(jourIndex: number): boolean {
    const jour = this.circuit.programme[jourIndex];
    return jour.zoneId !== null && !this.villesParJour[jourIndex];
  }

  isLoadingActivitesForJour(jourIndex: number): boolean {
    const jour = this.circuit.programme[jourIndex];
    return jour.zoneId !== null && !this.activitesParJour[jourIndex];
  }

  // ============================================
  // GESTION DU PROGRAMME
  // ============================================

  onDureeChange() {
    const duree = this.circuit.dureeJours;
    const current = this.circuit.programme.length;

    if (duree > current) {
      for (let i = current; i < duree; i++) {
        this.circuit.programme.push({
          jour: i + 1,
          description: '',
          zoneId: null,
          villeId: null,
          activiteIds: []
        });
      }
    } else if (duree < current) {
      this.circuit.programme = this.circuit.programme.slice(0, duree);
    }

    if (this.activeDayIndex >= this.circuit.programme.length) {
      this.activeDayIndex = Math.max(0, this.circuit.programme.length - 1);
    }
  }

  selectDay(index: number) {
    if (index >= 0 && index < this.circuit.programme.length) {
      this.activeDayIndex = index;
    }
  }

  goPrevDay() {
    this.selectDay(this.activeDayIndex - 1);
  }

  goNextDay() {
    this.selectDay(this.activeDayIndex + 1);
  }

  setStep4Section(section: 'highlights' | 'inclusions') {
    this.step4Section = section;
  }

  toggleActivite(jourIndex: number, activiteId: number) {
    const jour = this.circuit.programme[jourIndex];
    const index = jour.activiteIds.indexOf(activiteId);

    if (index > -1) {
      jour.activiteIds.splice(index, 1);
    } else {
      jour.activiteIds.push(activiteId);
    }
  }

  isActiviteSelected(jourIndex: number, activiteId: number): boolean {
    return this.circuit.programme[jourIndex].activiteIds.includes(activiteId);
  }

  // ============================================
  // GESTION DES IMAGES
  // ============================================

  onHeroSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.circuit.imageHero = file;
    delete this.errors['hero'];

    const reader = new FileReader();
    reader.onload = () => {
      this.previewHero = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  onGalerieSelect(event: any) {
    const files = Array.from(event.target.files) as File[];

    if (files.length < 3) {
      this.errors['galerie'] = 'Minimum 3 images requises';
      return;
    }
    if (files.length > 10) {
      this.errors['galerie'] = 'Maximum 10 images';
      return;
    }

    this.circuit.imagesGalerie = files;
    delete this.errors['galerie'];

    this.previewsGalerie = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewsGalerie.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  // ============================================
  // LISTES DYNAMIQUES
  // ============================================

  addPointFort() {
    if (this.circuit.pointsForts.length < 5) {
      this.circuit.pointsForts.push({ icon: '🏛️', title: '', desc: '' });
    }
  }

  removePointFort(index: number) {
    if (this.circuit.pointsForts.length > 1) {
      this.circuit.pointsForts.splice(index, 1);
    }
  }

  addPredefinedPointFort(point: { icon: string, title: string, desc: string }) {
    if (this.circuit.pointsForts.length < 5) {
      this.circuit.pointsForts.unshift({ ...point });
    }
  }

  addInclus() {
    this.circuit.inclus.push('');
  }

  removeInclus(index: number) {
    if (this.circuit.inclus.length > 1) {
      this.circuit.inclus.splice(index, 1);
    }
  }

  addNonInclus() {
    this.circuit.nonInclus.push('');
  }

  removeNonInclus(index: number) {
    if (this.circuit.nonInclus.length > 1) {
      this.circuit.nonInclus.splice(index, 1);
    }
  }

  // ============================================
  // NAVIGATION ENTRE ÉTAPES
  // ============================================

  canGoNext(): boolean {
    if (this.currentStep === 1) {
      return this.isStep1Valid();
    }
    if (this.currentStep === 2) {
      return this.isStep2Valid();
    }
    if (this.currentStep === 3) {
      return this.isStep3Valid();
    }
    return true;
  }

  nextStep() {
    if (this.canGoNext()) {
      this.currentStep++;
    } else {
      this.showStepErrors();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errors = {};
    }
  }

  goToStep(step: number) {
    if (step <= this.currentStep || this.canGoNext()) {
      this.currentStep = step;
      this.errors = {};
    }
  }

  // ============================================
  // VALIDATION
  // ============================================

  private isStep1Valid(): boolean {
    return !!(this.circuit.titre.trim() &&
              this.circuit.description.trim() &&
              this.circuit.dureeJours >= 1 &&
              this.circuit.prixEuros > 0);
  }

  private isStep2Valid(): boolean {
    const hasHero = !!this.circuit.imageHero || !!this.existingHeroUrl;
    const hasGalerie = this.circuit.imagesGalerie.length >= 3 || this.existingGalerieUrls.length >= 3;
    return hasHero && hasGalerie;
  }

  private isStep3Valid(): boolean {
    return this.getProgrammeMissingDetails().length === 0;
  }

  private isStep4Valid(): boolean {
    const hasInclusions = this.circuit.inclus.some(item => item.trim());
    const hasNonInclusions = this.circuit.nonInclus.some(item => item.trim());
    return hasInclusions && hasNonInclusions;
  }

  private showStepErrors() {
    if (this.currentStep === 1) {
      this.validateStep1();
    } else if (this.currentStep === 2) {
      this.validateStep2();
    } else if (this.currentStep === 3) {
      this.validateStep3();
    } else if (this.currentStep === 4) {
      this.validateStep4();
    }
  }

  private validateStep1(): boolean {
    this.errors = {};

    if (!this.circuit.titre.trim()) {
      this.errors['titre'] = 'Le titre est obligatoire';
      return false;
    }
    if (!this.circuit.description.trim()) {
      this.errors['description'] = 'La description est obligatoire';
      return false;
    }
    if (this.circuit.dureeJours < 1) {
      this.errors['duree'] = 'La durée doit être d\'au moins 1 jour';
      return false;
    }
    if (this.circuit.prixEuros <= 0) {
      this.errors['prix'] = 'Le prix doit être supérieur à 0';
      return false;
    }

    return true;
  }

  private validateStep2(): boolean {
    this.errors = {};

    if (!this.circuit.imageHero && !this.existingHeroUrl) {
      this.errors['hero'] = 'L\'image principale est obligatoire';
      return false;
    }
    if (this.circuit.imagesGalerie.length > 0 && this.circuit.imagesGalerie.length < 3) {
      this.errors['galerie'] = 'Minimum 3 images de galerie requises';
      return false;
    }
    if (this.circuit.imagesGalerie.length > 10) {
      this.errors['galerie'] = 'Maximum 10 images';
      return false;
    }
    if (this.circuit.imagesGalerie.length === 0 && this.existingGalerieUrls.length < 3) {
      this.errors['galerie'] = 'Minimum 3 images de galerie requises';
      return false;
    }

    return true;
  }

  private validateStep3(): boolean {
    this.errors = {};
    this.programmeMissingDetails = [];

    const invalidDays = this.getProgrammeMissingDetails();
    if (invalidDays.length > 0) {
      this.programmeMissingDetails = invalidDays;
      this.errors['programme'] = 'Certains jours sont incomplets. Merci de compléter les informations manquantes.';
      return false;
    }

    return true;
  }

  private validateStep4(): boolean {
    this.errors = {};

    const hasInclusions = this.circuit.inclus.some(item => item.trim());
    const hasNonInclusions = this.circuit.nonInclus.some(item => item.trim());

    if (!hasInclusions) {
      this.errors['inclus'] = 'Au moins une inclusion doit être définie';
      return false;
    }

    if (!hasNonInclusions) {
      this.errors['nonInclus'] = 'Au moins une non-inclusion doit être définie';
      return false;
    }

    return true;
  }

  // ============================================
  // SOUMISSION
  // ============================================

  async onSubmit() {
    if (!this.isStep1Valid() || !this.isStep2Valid() || !this.isStep3Valid() || !this.isStep4Valid()) {
      if (!this.isStep1Valid()) {
        this.currentStep = 1;
        this.validateStep1();
      } else if (!this.isStep2Valid()) {
        this.currentStep = 2;
        this.validateStep2();
      } else if (!this.isStep3Valid()) {
        this.currentStep = 3;
        this.validateStep3();
      } else if (!this.isStep4Valid()) {
        this.currentStep = 4;
        this.validateStep4();
      }
      return;
    }

    this.loading.submit = true;

    try {
      const heroUrl = await this.resolveHeroUrl();
      const galerieUrls = await this.resolveGalerieUrls();

      const premierJourAvecVille = this.circuit.programme.find(j => j.villeId && j.zoneId);
      const villeNom = premierJourAvecVille
        ? (this.getVilleNomById(premierJourAvecVille.villeId || null) || this.circuitDto?.villeNom || '')
        : (this.circuitDto?.villeNom || '');
      const localisation = villeNom || this.getZoneNomById(premierJourAvecVille?.zoneId || this.circuitDto?.zoneId || null);

      if (!this.circuitDto) {
        throw new Error('Circuit introuvable');
      }

      const prixIndicatif = this.getPrixIndicatifEnEur();
      const payload: CircuitDTO = {
        ...(this.circuitDto || {}),
        id: this.circuitDto.id,
        titre: this.circuit.titre.trim(),
        resume: this.buildResume(this.circuit.description),
        description: this.circuit.description.trim(),
        dureeIndicative: `${this.circuit.dureeJours} jour${this.circuit.dureeJours > 1 ? 's' : ''}`,
        prixIndicatif,
        formuleProposee: this.circuitDto?.formuleProposee || 'Standard',
        localisation,
        villeNom: villeNom,
        villeId: premierJourAvecVille?.villeId || null,
        zoneId: premierJourAvecVille?.zoneId || null,
        img: heroUrl,
        galerie: galerieUrls,
        programme: this.circuit.programme.map(p => ({
          day: p.jour,
          title: p.title || '',
          description: p.description.trim(),
          activities: p.activiteIds,
          zoneId: p.zoneId,
          villeId: p.villeId
        })),
        pointsForts: this.circuit.pointsForts.filter(p =>
          p.icon.trim() && p.title.trim() && p.desc.trim()
        ),
        inclus: this.circuit.inclus.map(s => s.trim()).filter(s => s),
        nonInclus: this.circuit.nonInclus.map(s => s.trim()).filter(s => s),
        activiteIds: Array.from(new Set(
          this.circuit.programme.flatMap(p => p.activiteIds)
        )),
        actif: this.circuitDto?.actif ?? true,
        aLaUne: this.circuitDto?.aLaUne ?? false
      };

      await lastValueFrom(this.circuitService.updateCircuit(this.circuitDto.id, payload));
      this.clearDraft();
      this.router.navigate(['/admin/circuits']);

    } catch (error) {
      console.error('Erreur mise à jour circuit:', error);
      this.errors['submit'] = 'Erreur lors de la mise à jour du circuit';
      this.loading.submit = false;
    }
  }

  private async resolveHeroUrl(): Promise<string> {
    if (this.circuit.imageHero) {
      const heroRes = await lastValueFrom(
        this.circuitService.uploadImage(this.circuit.imageHero, 'circuits/hero')
      );
      return heroRes.url;
    }
    return this.existingHeroUrl || '';
  }

  private async resolveGalerieUrls(): Promise<string[]> {
    if (this.circuit.imagesGalerie.length > 0) {
      const uploads = this.circuit.imagesGalerie.map(file =>
        lastValueFrom(this.circuitService.uploadImage(file, 'circuits/galerie'))
      );
      const results = await Promise.all(uploads);
      return results.map(r => r.url);
    }
    return this.existingGalerieUrls || [];
  }

  cancel() {
    this.router.navigate(['/admin/circuits']);
  }

  // ============================================
  // HELPERS
  // ============================================

  getProgressPercent(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  trackByIndex(index: number): number {
    return index;
  }

  getProgrammeMissingDetails(): Array<{ jour: number; missing: string[] }> {
    return this.circuit.programme
      .map(jour => {
        const missing: string[] = [];
        if (!jour.zoneId) missing.push('zone');
        if (!jour.villeId) missing.push('ville');
        if (!jour.description.trim()) missing.push('description');
        if (missing.length === 0) return null;
        return { jour: jour.jour, missing };
      })
      .filter((item): item is { jour: number; missing: string[] } => item !== null);
  }

  getStep3MissingSummary(): string[] {
    const summary: string[] = [];

    const programmeMissing = this.getProgrammeMissingDetails();
    if (programmeMissing.length > 0) {
      programmeMissing.forEach(item => {
        summary.push(`Jour ${item.jour} : ${item.missing.join(', ')}`);
      });
    }

    return summary;
  }

  getStep4MissingSummary(): string[] {
    const summary: string[] = [];
    if (!this.circuit.inclus.some(item => item.trim())) {
      summary.push('Inclus : au moins un élément');
    }
    if (!this.circuit.nonInclus.some(item => item.trim())) {
      summary.push('Non inclus : au moins un élément');
    }
    return summary;
  }

  getDayMissingFields(index: number): string[] {
    const jour = this.circuit.programme[index];
    if (!jour) return [];
    const missing: string[] = [];
    if (!jour.zoneId) missing.push('zone');
    if (!jour.villeId) missing.push('ville');
    if (!jour.description.trim()) missing.push('description');
    return missing;
  }

  private getVilleNomById(villeId: number | null): string {
    if (!villeId) return '';
    const allVilles = Object.values(this.villesParJour).flat();
    return allVilles.find(v => v.id === villeId)?.nom || '';
  }

  private getZoneNomById(zoneId: number | null): string {
    if (!zoneId) return '';
    return this.zones.find(zone => zone.idZone === zoneId)?.nom || '';
  }

  private buildResume(description: string): string {
    const trimmed = description.trim();
    if (trimmed.length <= 150) {
      return trimmed;
    }

    return `${trimmed.slice(0, 147).trim()}...`;
  }

  private normalizePointIcon(icon: string | undefined | null): string {
    if (!icon) {
      return '🏛️';
    }

    return this.pointIconMap[icon] || icon;
  }

  onPriceCurrencyChange(newCurrency: 'EUR' | 'XOF') {
    if (newCurrency === this.lastPriceCurrency) {
      return;
    }

    const current = Number(this.circuit.prixEuros);
    if (!isNaN(current) && current > 0) {
      if (newCurrency === 'XOF') {
        this.circuit.prixEuros = Math.round(current * this.RATE_XOF_PER_EUR);
      } else {
        this.circuit.prixEuros = Number((current / this.RATE_XOF_PER_EUR).toFixed(2));
      }
    }
    this.lastPriceCurrency = newCurrency;
  }

  getPriceConversionLabel(): string {
    const value = Number(this.circuit.prixEuros);
    if (!value || isNaN(value)) return '';
    if (this.priceCurrency === 'EUR') {
      const xof = Math.round(value * this.RATE_XOF_PER_EUR);
      return `≈ ${xof.toLocaleString()} XOF`;
    }
    const eur = Number((value / this.RATE_XOF_PER_EUR).toFixed(2));
    return `≈ ${eur.toLocaleString()} EUR`;
  }

  private getPrixIndicatifEnEur(): number {
    const value = Number(this.circuit.prixEuros);
    if (this.priceCurrency === 'XOF') {
      return Number((value / this.RATE_XOF_PER_EUR).toFixed(2));
    }
    return value;
  }

  // ============================================
  // BROUILLON (AUTO-SAVE)
  // ============================================

  private getDraftKey(): string {
    return `${this.DRAFT_KEY_PREFIX}${this.circuitId || 'unknown'}`;
  }

  private startAutoSave() {
    if (this.autosaveTimer) {
      window.clearInterval(this.autosaveTimer);
    }
    this.autosaveTimer = window.setInterval(() => {
      this.saveDraft();
    }, this.AUTOSAVE_MS);
  }

  private saveDraft() {
    if (this.isLoading || !this.circuitId) {
      return;
    }
    const draft = {
      version: 1,
      savedAt: Date.now(),
      currentStep: this.currentStep,
      activeDayIndex: this.activeDayIndex,
      step4Section: this.step4Section,
      circuit: {
        ...this.circuit,
        imageHero: null,
        imagesGalerie: []
      }
    };

    localStorage.setItem(this.getDraftKey(), JSON.stringify(draft));
    this.lastAutoSaveAt = draft.savedAt;
    this.draftSavedAt = draft.savedAt;
  }

  private checkDraft() {
    if (!this.circuitId) {
      this.draftAvailable = false;
      return;
    }
    const raw = localStorage.getItem(this.getDraftKey());
    if (!raw) {
      this.draftAvailable = false;
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.circuit) {
        this.draftAvailable = true;
        this.draftSavedAt = parsed.savedAt || null;
      }
    } catch {
      this.draftAvailable = false;
    }
  }

  restoreDraft() {
    const raw = localStorage.getItem(this.getDraftKey());
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.circuit) return;

      this.circuit = {
        ...this.circuit,
        ...parsed.circuit,
        imageHero: null,
        imagesGalerie: []
      };

      if (!this.circuit.programme || this.circuit.programme.length === 0) {
        this.initProgramme();
      } else {
      this.circuit.programme = this.circuit.programme.map((p, idx) => ({
        ...p,
        jour: idx + 1,
        title: p.title || ''
      }));
        this.circuit.dureeJours = this.circuit.programme.length;
      }

      this.currentStep = parsed.currentStep || 1;
      this.activeDayIndex = Math.min(parsed.activeDayIndex || 0, this.circuit.programme.length - 1);
      this.step4Section = parsed.step4Section || 'highlights';
      this.previewHero = null;
      this.previewsGalerie = [];
      this.errors = {};
      this.programmeMissingDetails = [];

      this.hydrateProgrammeCaches();

      this.draftAvailable = false;
      this.draftRestored = true;
    } catch {
      // ignore parse errors
    }
  }

  discardDraft() {
    this.clearDraft();
    this.draftAvailable = false;
  }

  saveDraftManual() {
    this.saveDraft();
    this.manualSaveNotice = true;
    window.setTimeout(() => {
      this.manualSaveNotice = false;
    }, 2500);
  }

  private clearDraft() {
    localStorage.removeItem(this.getDraftKey());
    this.lastAutoSaveAt = null;
    this.draftSavedAt = null;
    this.manualSaveNotice = false;
  }

  formatDraftDate(timestamp: number | null): string {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return '';
    }
  }
}
