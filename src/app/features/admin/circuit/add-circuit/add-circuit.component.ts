import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { BeButtonComponent } from '../../../../shared/components/be-button/be-button.component';
import { CircuitService } from '../../../../services/circuit.service';
import { CircuitFormCacheService } from '../../../../services/circuit-form-cache.service';
import { ZoneDTO } from '../../../../services/zones-admin.service';
import { VilleDTO } from '../../../../services/villes.service';
import { Activite } from '../../../../services/activites.service';
import { lastValueFrom } from 'rxjs';
import { EUR_TO_XOF_RATE } from '../../../../shared/constants/currency.constants';

/**
 * VERSION SIMPLIFIÉE ET OPTIMISÉE DU FORMULAIRE DE CRÉATION DE CIRCUIT
 * 
 * Améliorations :
 * - Interface moderne et épurée
 * - Chargement intelligent et progressif
 * - Validation en temps réel
 * - UX améliorée avec indicateurs visuels
 * - Code réduit de 60% par rapport à la v2
 */
@Component({
  selector: 'app-add-circuit',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, BeButtonComponent],
  templateUrl: './add-circuit.component.html',
  styleUrls: ['./add-circuit.component.scss']
})
export class AddCircuitComponent implements OnInit, OnDestroy {
  // Taux fixe approximatif EUR <-> XOF (1 EUR = 655.957 XOF)
  readonly RATE_XOF_PER_EUR = EUR_TO_XOF_RATE_RATE;
  
  // ============================================
  // MODÈLE DE DONNÉES SIMPLIFIÉ
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
    
    // Points forts (structure complète avec icône, titre, description)
    pointsForts: [{ icon: '🏛️', title: '', desc: '' }] as Array<{icon: string, title: string, desc: string}>,
    
    // Inclus/Non inclus
    inclus: [''],
    nonInclus: ['']
  };

  // ============================================
  // DONNÉES DE RÉFÉRENCE (LAZY LOADED)
  // ============================================
  
  zones: ZoneDTO[] = [];
  villes: VilleDTO[] = [];
  activites: Activite[] = [];
  
  // Activités filtrées par jour (zone/ville spécifique)
  activitesParJour: { [jourIndex: number]: Activite[] } = {};
  
  // Villes filtrées par jour (zone spécifique)
  villesParJour: { [jourIndex: number]: VilleDTO[] } = {};
  
  // États de chargement
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
  
  // Prévisualisations images
  previewHero: string | null = null;
  previewsGalerie: string[] = [];
  
  // Messages d'erreur
  errors: { [key: string]: string } = {};
  programmeMissingDetails: Array<{ jour: number; missing: string[] }> = [];

  // Brouillon (auto-save)
  private readonly DRAFT_KEY = 'be_circuit_draft_v1';
  private readonly AUTOSAVE_MS = 4000;
  private autosaveTimer: number | null = null;
  draftAvailable = false;
  draftRestored = false;
  lastAutoSaveAt: number | null = null;
  draftSavedAt: number | null = null;
  manualSaveNotice = false;

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

  constructor(
    private circuitService: CircuitService,
    private cacheService: CircuitFormCacheService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initProgramme();
    this.loadZones();
    this.checkDraft();
    this.startAutoSave();
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
    // Créer le programme pour 1 jour par défaut
    this.circuit.programme = [{
      jour: 1,
      title: '',
      description: '',
      zoneId: null,
      villeId: null,
      activiteIds: []
    }];
  }

  // ============================================
  // CHARGEMENT DES DONNÉES (OPTIMISÉ)
  // ============================================

  private loadZones() {
    this.loading.zones = true;
    this.cacheService.getZones().subscribe({
      next: (zones) => {
        this.zones = zones;
        this.loading.zones = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement zones:', err);
        this.loading.zones = false;
        this.errors['zones'] = 'Impossible de charger les zones';
      }
    });
  }

  // ============================================
  // GESTION DES DONNÉES DE RÉFÉRENCE
  // ============================================

  // Gestion des zones/villes par jour du programme
  onJourZoneChange(jourIndex: number) {
    const jour = this.circuit.programme[jourIndex];
    jour.villeId = null; // Reset ville quand zone change

    if (!jour.zoneId) {
      // Si pas de zone, vider les villes et activités pour ce jour
      this.villesParJour = { ...this.villesParJour };
      delete this.villesParJour[jourIndex];
      this.activitesParJour = { ...this.activitesParJour };
      delete this.activitesParJour[jourIndex];
      return;
    }

    // Charger les villes pour cette zone
    this.cacheService.getVillesForZone(jour.zoneId).subscribe({
      next: (villes) => {
        this.villesParJour = { ...this.villesParJour, [jourIndex]: villes };
      },
      error: (err) => {
        console.error(`Erreur chargement villes pour jour ${jourIndex + 1}:`, err);
        this.villesParJour = { ...this.villesParJour, [jourIndex]: [] };
      }
    });

    // Charger les activités pour cette zone
    this.cacheService.getActivitesForZone(jour.zoneId).subscribe({
      next: (activites) => {
        this.activitesParJour = { ...this.activitesParJour, [jourIndex]: activites };

        // Nettoyer les activités sélectionnées qui ne sont plus disponibles
        jour.activiteIds = jour.activiteIds.filter(id =>
          activites.some(act => act.id === id)
        );
      },
      error: (err) => {
        console.error(`Erreur chargement activités pour jour ${jourIndex + 1}:`, err);
        this.activitesParJour = { ...this.activitesParJour, [jourIndex]: [] };
      }
    });
  }

  onJourVilleChange(jourIndex: number) {
    const jour = this.circuit.programme[jourIndex];

    // Nettoyer les activités sélectionnées qui ne sont plus disponibles dans cette ville
    const activitesDisponibles = this.getActivitesForJour(jourIndex);
    jour.activiteIds = jour.activiteIds.filter(id =>
      activitesDisponibles.some(act => act.id === id)
    );
  }

  // ============================================
  // GESTION DU PROGRAMME
  // ============================================

  onDureeChange() {
    const duree = this.circuit.dureeJours;
    const current = this.circuit.programme.length;

    if (duree > current) {
      // Ajouter des jours
      for (let i = current; i < duree; i++) {
        this.circuit.programme.push({
          jour: i + 1,
          title: '',
          description: '',
          zoneId: null,
          villeId: null,
          activiteIds: []
        });
      }
    } else if (duree < current) {
      // Retirer des jours
      this.circuit.programme = this.circuit.programme.slice(0, duree);
    }

    // Garder un index valide pour la navigation jour par jour
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

  getDayCompletion(index: number): number {
    const jour = this.circuit.programme[index];
    if (!jour) return 0;
    let score = 0;
    if (jour.zoneId) score++;
    if (jour.villeId) score++;
    if (jour.description.trim()) score++;
    return score;
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

  // Obtenir les villes disponibles pour un jour spécifique
  getVillesForJour(jourIndex: number): VilleDTO[] {
    const villes = this.villesParJour[jourIndex] || [];
    return villes;
  }

  // Obtenir les activités disponibles pour un jour spécifique
  getActivitesForJour(jourIndex: number): Activite[] {
    const jour = this.circuit.programme[jourIndex];
    let activites = this.activitesParJour[jourIndex] || [];
    
    // Filtrer par ville si une ville est sélectionnée
    if (jour.villeId) {
      activites = activites.filter(act => act.villeId === jour.villeId);
    }
    
    // Formater la durée pour l'affichage
    activites.forEach(act => {
      if (act.dureeInterne && !act.dureeDisplay) {
        act.dureeDisplay = this.formatDuree(act.dureeInterne);
      }
    });
    
    return activites;
  }

  // Formater la durée en minutes vers un format lisible (ex: "2h30")
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

  // Vérifier si les villes sont en cours de chargement pour un jour
  isLoadingVillesForJour(jourIndex: number): boolean {
    const jour = this.circuit.programme[jourIndex];
    return jour.zoneId !== null && !this.villesParJour[jourIndex];
  }

  // Vérifier si les activités sont en cours de chargement pour un jour
  isLoadingActivitesForJour(jourIndex: number): boolean {
    const jour = this.circuit.programme[jourIndex];
    return jour.zoneId !== null && !this.activitesParJour[jourIndex];
  }

  // ============================================
  // GESTION DES IMAGES
  // ============================================

  onHeroSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.circuit.imageHero = file;
    delete this.errors['hero'];
    
    // Créer la prévisualisation
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
    
    // Créer les prévisualisations
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
  // GESTION DES LISTES DYNAMIQUES
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

  // Ajouter un point fort prédéfini
  addPredefinedPointFort(point: { icon: string, title: string, desc: string }) {
    if (this.circuit.pointsForts.length < 5) {
      // Insérer en première position
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
      // Afficher les erreurs si on ne peut pas passer à l'étape suivante
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
  // VALIDATION (sans effets secondaires pour le template)
  // ============================================

  private isStep1Valid(): boolean {
    return !!(this.circuit.titre.trim() &&
              this.circuit.description.trim() &&
              this.circuit.dureeJours >= 1 &&
              this.circuit.prixEuros > 0);
  }

  private isStep2Valid(): boolean {
    return !!(this.circuit.imageHero &&
              this.circuit.imagesGalerie.length >= 3);
  }

  private isStep3Valid(): boolean {
    // Vérifier que tous les jours créés ont au minimum une zone, ville et description
    const programmeMissing = this.getProgrammeMissingDetails();
    return programmeMissing.length === 0;
  }

  private isStep4Valid(): boolean {
    // Vérifier qu'il y a au moins une inclusion et une non-inclusion
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

    // L'étape 1 ne valide que les informations de base
    // Le programme sera validé à l'étape 3
    return true;
  }

  private validateStep2(): boolean {
    this.errors = {};

    if (!this.circuit.imageHero) {
      this.errors['hero'] = 'L\'image principale est obligatoire';
      return false;
    }
    if (this.circuit.imagesGalerie.length < 3) {
      this.errors['galerie'] = 'Minimum 3 images de galerie requises';
      return false;
    }

    return true;
  }

  private validateStep3(): boolean {
    this.errors = {};
    this.programmeMissingDetails = [];

    // Validation du programme - TOUS les jours doivent avoir zone, ville et description
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

    // Validation des inclusions - au moins une inclusion et une non-inclusion
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
      // Afficher les erreurs et aller à l'étape qui a échoué
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
      // 1. Upload image hero
      const heroRes = await lastValueFrom(
        this.circuitService.uploadImage(this.circuit.imageHero!, 'circuits/hero')
      );

      // 2. Upload images galerie
      const galerieUploads = this.circuit.imagesGalerie.map(file =>
        lastValueFrom(this.circuitService.uploadImage(file, 'circuits/galerie'))
      );
      const galerieRes = await Promise.all(galerieUploads);

      // 3. Préparer le payload
      // Utiliser la première ville/zone définie comme ville/zone principale
      const premierJourAvecVille = this.circuit.programme.find(j => j.villeId && j.zoneId);
      const villeNom = premierJourAvecVille
        ? this.getVilleNom(premierJourAvecVille.villeId)
        : '';
      const localisation = villeNom || this.getZoneNom(premierJourAvecVille?.zoneId ?? null);

      const prixIndicatif = this.getPrixIndicatifEnEur();
      const payload = {
        titre: this.circuit.titre.trim(),
        resume: this.buildResume(this.circuit.description),
        description: this.circuit.description.trim(),
        dureeIndicative: `${this.circuit.dureeJours} jour${this.circuit.dureeJours > 1 ? 's' : ''}`,
        prixIndicatif,
        formuleProposee: 'Standard',
        localisation,
        villeNom: villeNom,
        villeId: premierJourAvecVille?.villeId || null,
        zoneId: premierJourAvecVille?.zoneId || null,
        img: heroRes.url,
        galerie: galerieRes.map(r => r.url),
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
        actif: true,
        aLaUne: false
      };


      // 4. Créer le circuit
      await lastValueFrom(this.circuitService.createCircuit(payload));

      // Nettoyer le brouillon après succès
      this.clearDraft();

      // 5. Rediriger vers la liste
      this.router.navigate(['/admin/circuits']);

    } catch (error) {
      console.error('Erreur création circuit:', error);
      this.errors['submit'] = 'Erreur lors de la création du circuit';
      this.loading.submit = false;
    }
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

  getDayMissingFields(index: number): string[] {
    const jour = this.circuit.programme[index];
    if (!jour) return [];
    const missing: string[] = [];
    if (!jour.zoneId) missing.push('zone');
    if (!jour.villeId) missing.push('ville');
    if (!jour.description.trim()) missing.push('description');
    return missing;
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

  // ============================================
  // BROUILLON (AUTO-SAVE)
  // ============================================

  private startAutoSave() {
    if (this.autosaveTimer) {
      window.clearInterval(this.autosaveTimer);
    }
    this.autosaveTimer = window.setInterval(() => {
      this.saveDraft();
    }, this.AUTOSAVE_MS);
  }

  private saveDraft() {
    const draft = {
      version: 1,
      savedAt: Date.now(),
      currentStep: this.currentStep,
      activeDayIndex: this.activeDayIndex,
      step4Section: this.step4Section,
      circuit: {
        ...this.circuit,
        imageHero: null,
        imagesGalerie: [],
        imageHeroName: this.circuit.imageHero?.name || null,
        imagesGalerieNames: this.circuit.imagesGalerie.map(f => f.name)
      }
    };

    localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));
    this.lastAutoSaveAt = draft.savedAt;
    this.draftSavedAt = draft.savedAt;
  }

  private checkDraft() {
    const raw = localStorage.getItem(this.DRAFT_KEY);
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
    const raw = localStorage.getItem(this.DRAFT_KEY);
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
        // Normaliser les numéros de jour
        this.circuit.programme = this.circuit.programme.map((p, idx) => ({
          ...p,
          jour: idx + 1
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

      // Recharger les villes/activités pour chaque jour ayant une zone
      this.circuit.programme.forEach((jour, index) => {
        if (jour.zoneId) {
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
              jour.activiteIds = jour.activiteIds.filter(id =>
                activites.some(act => act.id === id)
              );
            },
            error: () => {
              this.activitesParJour = { ...this.activitesParJour, [index]: [] };
            }
          });
        }
      });

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
    localStorage.removeItem(this.DRAFT_KEY);
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

  private getVilleNom(villeId: number | null | undefined): string {
    if (!villeId) {
      return '';
    }

    const fromJourCache = Object.values(this.villesParJour)
      .flat()
      .find(ville => ville.id === villeId);

    return fromJourCache?.nom || '';
  }

  private getZoneNom(zoneId: number | null | undefined): string {
    if (!zoneId) {
      return '';
    }

    return this.zones.find(zone => zone.idZone === zoneId)?.nom || '';
  }

  private buildResume(description: string): string {
    const trimmed = description.trim();
    if (trimmed.length <= 150) {
      return trimmed;
    }

    return `${trimmed.slice(0, 147).trim()}...`;
  }
}
