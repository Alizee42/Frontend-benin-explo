import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { BeButtonComponent } from '../../../../shared/components/be-button/be-button.component';
import { CircuitService } from '../../../../services/circuit.service';
import { CircuitFormCacheService } from '../../../../services/circuit-form-cache.service';
import { ZoneDTO } from '../../../../services/zones-admin.service';
import { VilleDTO } from '../../../../services/villes.service';
import { AddCircuitStep1Component } from './step1/add-circuit-step1.component';
import { AddCircuitStep2Component } from './step2/add-circuit-step2.component';
import { AddCircuitStep3Component } from './step3/add-circuit-step3.component';
import { AddCircuitStep4Component } from './step4/add-circuit-step4.component';
import { CircuitFormData, PointFort, ProgrammeJour } from './circuit-form.types';
import { EUR_TO_XOF_RATE } from '../../../../shared/constants/currency.constants';

@Component({
  selector: 'app-add-circuit',
  standalone: true,
  imports: [
    CommonModule, FormsModule, HeaderComponent, BeButtonComponent,
    AddCircuitStep1Component, AddCircuitStep2Component,
    AddCircuitStep3Component, AddCircuitStep4Component
  ],
  templateUrl: './add-circuit.component.html',
  styleUrls: ['./add-circuit.component.scss']
})
export class AddCircuitComponent implements OnInit, OnDestroy {
  readonly RATE_XOF_PER_EUR = EUR_TO_XOF_RATE;

  circuit: CircuitFormData = {
    titre: '',
    description: '',
    dureeJours: 1,
    prixEuros: 0,
    imageHero: null,
    imagesGalerie: [],
    programme: [],
    pointsForts: [{ icon: '🏛️', title: '', desc: '' }],
    inclus: [''],
    nonInclus: ['']
  };

  zones: ZoneDTO[] = [];
  villesParJour: { [k: number]: VilleDTO[] } = {};
  activitesParJour: { [k: number]: any[] } = {};

  loading = { zones: false, submit: false };
  currentStep = 1;
  totalSteps = 4;

  previewHero: string | null = null;
  previewsGalerie: string[] = [];

  errors: { [key: string]: string } = {};
  programmeMissingDetails: Array<{ jour: number; missing: string[] }> = [];

  private readonly DRAFT_KEY = 'be_circuit_draft_v1';
  private readonly AUTOSAVE_MS = 4000;
  private autosaveTimer: number | null = null;
  draftAvailable = false;
  draftRestored = false;
  draftSavedAt: number | null = null;
  lastAutoSaveAt: number | null = null;
  manualSaveNotice = false;

  readonly predefinedPointsForts: PointFort[] = [
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

  ngOnInit(): void {
    this.initProgramme();
    this.loadZones();
    this.checkDraft();
    this.startAutoSave();
  }

  ngOnDestroy(): void {
    if (this.autosaveTimer) {
      window.clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  private initProgramme(): void {
    this.circuit.programme = [{
      jour: 1, title: '', description: '', zoneId: null, villeId: null, activiteIds: []
    }];
  }

  private loadZones(): void {
    this.loading.zones = true;
    this.cacheService.getZones().subscribe({
      next: (zones) => { this.zones = zones; this.loading.zones = false; },
      error: () => { this.loading.zones = false; this.errors['zones'] = 'Impossible de charger les zones'; }
    });
  }

  onJourZoneChange(jourIndex: number): void {
    const jour = this.circuit.programme[jourIndex];
    jour.villeId = null;
    if (!jour.zoneId) {
      const vp = { ...this.villesParJour }; delete vp[jourIndex]; this.villesParJour = vp;
      const ap = { ...this.activitesParJour }; delete ap[jourIndex]; this.activitesParJour = ap;
      return;
    }
    this.cacheService.getVillesForZone(jour.zoneId).subscribe({
      next: (villes) => { this.villesParJour = { ...this.villesParJour, [jourIndex]: villes }; },
      error: () => { this.villesParJour = { ...this.villesParJour, [jourIndex]: [] }; }
    });
    this.cacheService.getActivitesForZone(jour.zoneId).subscribe({
      next: (activites) => {
        this.activitesParJour = { ...this.activitesParJour, [jourIndex]: activites };
        jour.activiteIds = jour.activiteIds.filter(id => activites.some((a: any) => a.id === id));
      },
      error: () => { this.activitesParJour = { ...this.activitesParJour, [jourIndex]: [] }; }
    });
  }

  onJourVilleChange(jourIndex: number): void {
    const jour = this.circuit.programme[jourIndex];
    const activites = this.activitesParJour[jourIndex] || [];
    jour.activiteIds = jour.activiteIds.filter(id =>
      !jour.villeId || activites.some((a: any) => a.id === id && a.villeId === jour.villeId)
    );
  }

  onDureeChange(): void {
    const duree = this.circuit.dureeJours;
    const current = this.circuit.programme.length;
    if (duree > current) {
      for (let i = current; i < duree; i++) {
        this.circuit.programme.push({ jour: i + 1, title: '', description: '', zoneId: null, villeId: null, activiteIds: [] });
      }
    } else if (duree < current) {
      this.circuit.programme = this.circuit.programme.slice(0, duree);
    }
  }

  onHeroSelected(event: { file: File; preview: string }): void {
    this.circuit.imageHero = event.file;
    this.previewHero = event.preview;
    delete this.errors['hero'];
  }

  onGalerieSelected(event: { files: File[]; previews: string[] }): void {
    if (event.files.length < 3) { this.errors['galerie'] = 'Minimum 3 images requises'; return; }
    if (event.files.length > 10) { this.errors['galerie'] = 'Maximum 10 images'; return; }
    this.circuit.imagesGalerie = event.files;
    this.previewsGalerie = event.previews;
    delete this.errors['galerie'];
  }

  canGoNext(): boolean {
    switch (this.currentStep) {
      case 1: return this.isStep1Valid();
      case 2: return this.isStep2Valid();
      case 3: return this.isStep3Valid();
      default: return true;
    }
  }

  nextStep(): void {
    if (this.canGoNext()) this.currentStep++;
    else this.showStepErrors();
  }

  prevStep(): void {
    if (this.currentStep > 1) { this.currentStep--; this.errors = {}; }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.canGoNext()) { this.currentStep = step; this.errors = {}; }
  }

  getProgressPercent(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  private isStep1Valid(): boolean {
    return !!(this.circuit.titre.trim() && this.circuit.description.trim() &&
              this.circuit.dureeJours >= 1 && this.circuit.prixEuros > 0);
  }

  private isStep2Valid(): boolean {
    return !!(this.circuit.imageHero && this.circuit.imagesGalerie.length >= 3);
  }

  private isStep3Valid(): boolean {
    return this.getProgrammeMissingDetails().length === 0;
  }

  private isStep4Valid(): boolean {
    return this.circuit.inclus.some(i => i.trim()) && this.circuit.nonInclus.some(i => i.trim());
  }

  private showStepErrors(): void {
    this.errors = {};
    this.programmeMissingDetails = [];
    if (this.currentStep === 1) {
      if (!this.circuit.titre.trim()) this.errors['titre'] = 'Le titre est obligatoire';
      if (!this.circuit.description.trim()) this.errors['description'] = 'La description est obligatoire';
      if (this.circuit.dureeJours < 1) this.errors['duree'] = 'La durée doit être d\'au moins 1 jour';
      if (this.circuit.prixEuros <= 0) this.errors['prix'] = 'Le prix doit être supérieur à 0';
    } else if (this.currentStep === 2) {
      if (!this.circuit.imageHero) this.errors['hero'] = 'L\'image principale est obligatoire';
      if (this.circuit.imagesGalerie.length < 3) this.errors['galerie'] = 'Minimum 3 images de galerie requises';
    } else if (this.currentStep === 3) {
      const missing = this.getProgrammeMissingDetails();
      if (missing.length > 0) {
        this.programmeMissingDetails = missing;
        this.errors['programme'] = 'Certains jours sont incomplets.';
      }
    } else if (this.currentStep === 4) {
      if (!this.circuit.inclus.some(i => i.trim())) this.errors['inclus'] = 'Au moins une inclusion doit être définie';
      if (!this.circuit.nonInclus.some(i => i.trim())) this.errors['nonInclus'] = 'Au moins une non-inclusion doit être définie';
    }
  }

  getProgrammeMissingDetails(): Array<{ jour: number; missing: string[] }> {
    return this.circuit.programme
      .map(jour => {
        const missing: string[] = [];
        if (!jour.zoneId) missing.push('zone');
        if (!jour.villeId) missing.push('ville');
        if (!jour.description.trim()) missing.push('description');
        return missing.length > 0 ? { jour: jour.jour, missing } : null;
      })
      .filter((item): item is { jour: number; missing: string[] } => item !== null);
  }

  async onSubmit(): Promise<void> {
    if (!this.isStep1Valid() || !this.isStep2Valid() || !this.isStep3Valid() || !this.isStep4Valid()) {
      if (!this.isStep1Valid()) { this.currentStep = 1; }
      else if (!this.isStep2Valid()) { this.currentStep = 2; }
      else if (!this.isStep3Valid()) { this.currentStep = 3; }
      else { this.currentStep = 4; }
      this.showStepErrors();
      return;
    }

    this.loading.submit = true;
    try {
      const heroRes = await lastValueFrom(this.circuitService.uploadImage(this.circuit.imageHero!, 'circuits/hero'));
      const galerieRes = await Promise.all(
        this.circuit.imagesGalerie.map(f => lastValueFrom(this.circuitService.uploadImage(f, 'circuits/galerie')))
      );

      const premierJour = this.circuit.programme.find(j => j.villeId && j.zoneId);
      const villeNom = premierJour ? this.getVilleNom(premierJour.villeId) : '';
      const localisation = villeNom || this.getZoneNom(premierJour?.zoneId ?? null);
      const prixIndicatif = this.circuit.prixEuros;

      const payload = {
        titre: this.circuit.titre.trim(),
        resume: this.buildResume(this.circuit.description),
        description: this.circuit.description.trim(),
        dureeIndicative: `${this.circuit.dureeJours} jour${this.circuit.dureeJours > 1 ? 's' : ''}`,
        prixIndicatif,
        formuleProposee: 'Standard',
        localisation,
        villeNom,
        villeId: premierJour?.villeId || null,
        zoneId: premierJour?.zoneId || null,
        img: heroRes.url,
        galerie: galerieRes.map(r => r.url),
        programme: this.circuit.programme.map(p => ({
          day: p.jour, title: p.title || '', description: p.description.trim(),
          activities: p.activiteIds, zoneId: p.zoneId, villeId: p.villeId
        })),
        pointsForts: this.circuit.pointsForts.filter(p => p.icon.trim() && p.title.trim() && p.desc.trim()),
        inclus: this.circuit.inclus.map(s => s.trim()).filter(s => s),
        nonInclus: this.circuit.nonInclus.map(s => s.trim()).filter(s => s),
        activiteIds: Array.from(new Set(this.circuit.programme.flatMap(p => p.activiteIds))),
        actif: true,
        aLaUne: false
      };

      await lastValueFrom(this.circuitService.createCircuit(payload));
      this.clearDraft();
      this.router.navigate(['/admin/circuits']);
    } catch {
      this.errors['submit'] = 'Erreur lors de la création du circuit';
      this.loading.submit = false;
    }
  }

  cancel(): void { this.router.navigate(['/admin/circuits']); }

  // --- Auto-save ---
  private startAutoSave(): void {
    if (this.autosaveTimer) window.clearInterval(this.autosaveTimer);
    this.autosaveTimer = window.setInterval(() => this.saveDraft(), this.AUTOSAVE_MS);
  }

  private saveDraft(): void {
    const draft = {
      version: 1, savedAt: Date.now(),
      currentStep: this.currentStep,
      circuit: { ...this.circuit, imageHero: null, imagesGalerie: [],
        imageHeroName: this.circuit.imageHero?.name || null,
        imagesGalerieNames: this.circuit.imagesGalerie.map(f => f.name) }
    };
    localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));
    this.lastAutoSaveAt = draft.savedAt;
    this.draftSavedAt = draft.savedAt;
  }

  private checkDraft(): void {
    const raw = localStorage.getItem(this.DRAFT_KEY);
    if (!raw) { this.draftAvailable = false; return; }
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.circuit) { this.draftAvailable = true; this.draftSavedAt = parsed.savedAt || null; }
    } catch { this.draftAvailable = false; }
  }

  restoreDraft(): void {
    const raw = localStorage.getItem(this.DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.circuit) return;
      this.circuit = { ...this.circuit, ...parsed.circuit, imageHero: null, imagesGalerie: [] };
      if (!this.circuit.programme?.length) { this.initProgramme(); }
      else {
        this.circuit.programme = this.circuit.programme.map((p: ProgrammeJour, idx: number) => ({ ...p, jour: idx + 1 }));
        this.circuit.dureeJours = this.circuit.programme.length;
      }
      this.currentStep = parsed.currentStep || 1;
      this.previewHero = null;
      this.previewsGalerie = [];
      this.errors = {};
      this.programmeMissingDetails = [];
      this.circuit.programme.forEach((jour, index) => {
        if (jour.zoneId) {
          this.cacheService.getVillesForZone(jour.zoneId).subscribe({
            next: (villes) => { this.villesParJour = { ...this.villesParJour, [index]: villes }; },
            error: () => { this.villesParJour = { ...this.villesParJour, [index]: [] }; }
          });
          this.cacheService.getActivitesForZone(jour.zoneId).subscribe({
            next: (activites) => { this.activitesParJour = { ...this.activitesParJour, [index]: activites }; },
            error: () => { this.activitesParJour = { ...this.activitesParJour, [index]: [] }; }
          });
        }
      });
      this.draftAvailable = false;
      this.draftRestored = true;
    } catch { /* ignore */ }
  }

  discardDraft(): void { this.clearDraft(); this.draftAvailable = false; }

  saveDraftManual(): void {
    this.saveDraft();
    this.manualSaveNotice = true;
    window.setTimeout(() => { this.manualSaveNotice = false; }, 2500);
  }

  private clearDraft(): void {
    localStorage.removeItem(this.DRAFT_KEY);
    this.lastAutoSaveAt = null; this.draftSavedAt = null; this.manualSaveNotice = false;
  }

  formatDraftDate(timestamp: number | null): string {
    if (!timestamp) return '';
    try { return new Date(timestamp).toLocaleString(); } catch { return ''; }
  }

  private getVilleNom(villeId: number | null | undefined): string {
    if (!villeId) return '';
    return Object.values(this.villesParJour).flat().find(v => v.id === villeId)?.nom || '';
  }

  private getZoneNom(zoneId: number | null | undefined): string {
    if (!zoneId) return '';
    return this.zones.find(z => z.idZone === zoneId)?.nom || '';
  }

  private buildResume(description: string): string {
    const t = description.trim();
    return t.length <= 150 ? t : `${t.slice(0, 147).trim()}...`;
  }
}
