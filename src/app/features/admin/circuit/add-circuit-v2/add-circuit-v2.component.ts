import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { BeButtonComponent } from '../../../../shared/components/be-button/be-button.component';
import { CircuitService } from '../../../../services/circuit.service';
import { ActivitesService, Activite } from '../../../../services/activites.service';
import { ZonesAdminService, ZoneDTO as Zone } from '../../../../services/zones-admin.service';
import { VillesService, VilleDTO } from '../../../../services/villes.service';
import { CircuitForm, CircuitProgrammeDayForm, CircuitPointFortForm } from '../../../../models/circuit-form.model';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-circuit-v2',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, BeButtonComponent],
  templateUrl: './add-circuit-v2.component.html',
  styleUrls: ['./add-circuit-v2.component.scss']
})
export class AddCircuitV2Component {
  readonly RATE_XOF_PER_EUR = 655.957;

  form: CircuitForm = {
    titre: '',
    resume: '',
    description: '',
    dureeIndicative: '',
    prixIndicatif: 0,
    formuleProposee: '',
    actif: true,
    zoneId: null,
    villeId: null,
    img: '',
    galerie: [],
    programme: [],
    pointsForts: [{ icon: '', title: '', desc: '' }],
    inclus: [''],
    nonInclus: ['']
  };

  // mêmes points forts prédéfinis que dans l'ancien composant
  predefinedPointsForts: CircuitPointFortForm[] = [
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
    { icon: '🌅', title: 'Couchers de soleil', desc: "Assistez à des spectacles naturels inoubliables" },
    { icon: '🐘', title: 'Faune sauvage', desc: 'Observez les animaux dans leur habitat naturel' },
    { icon: '🌺', title: 'Flore tropicale', desc: 'Découvrez une végétation luxuriante et colorée' },
    { icon: '🎶', title: 'Musique & Danse', desc: 'Vivez au rythme des percussions et danses traditionnelles' },
    { icon: '🏺', title: 'Archéologie', desc: 'Explorez les vestiges du passé africain' }
  ];

  heroImageFile: File | null = null;
  galerieFiles: File[] = [];
  heroPreview: string | null = null;
  galeriePreviews: string[] = [];

  currentStep = 1;
  saisirEnCFA = false;
  isLoading = false;

  // durée prédéfinie sélectionnée
  selectedDurationPreset: string | null = null;
  // mapping simple durée prédéfinie -> nombre de jours
  readonly durationToDays: Record<string, number> = {
    '1 jour': 1,
    '2 jours': 2,
    '3 jours': 3,
    '4 jours': 4,
    '5 jours': 5,
    '7 jours': 7,
    '10 jours': 10,
    '14 jours': 14
  };

  get durationPresets(): string[] {
    return Object.keys(this.durationToDays);
  }

  zones: Zone[] = [];
  villes: VilleDTO[] = [];
  activites: Activite[] = [];

  // filtres simples par jour
  activityFilterText: string[] = [];

  constructor(
    private circuitService: CircuitService,
    private zonesService: ZonesAdminService,
    private villesService: VillesService,
    private activitesService: ActivitesService,
    private router: Router
  ) {}

  ngOnInit() {
    // initialiser un jour de programme par défaut
    this.form.programme = [this.createEmptyDay(1)];
    this.activityFilterText = [''];
    this.loadZones();
    this.loadVilles();
    this.loadActivites();
  }

  private createEmptyDay(day: number): CircuitProgrammeDayForm {
    return {
      day,
      description: '',
      approxTime: null,
      mealsIncluded: [],
      activities: [],
      zoneId: null,
      villeId: null
    };
  }

  onDurationPresetChange() {
    const preset = this.selectedDurationPreset || '';
    this.form.dureeIndicative = preset;

    const days = this.durationToDays[preset];
    if (!days || days <= 0) {
      return;
    }

    const current = this.form.programme.length;
    if (current < days) {
      for (let i = current + 1; i <= days; i++) {
        this.form.programme.push(this.createEmptyDay(i));
        this.activityFilterText.push('');
      }
    } else if (current > days) {
      this.form.programme = this.form.programme.slice(0, days);
      this.activityFilterText = this.activityFilterText.slice(0, days);
    }

    this.form.programme.forEach((d, i) => d.day = i + 1);
  }

  // Optionnel : si on tape "3 jours" à la main, on peut recaler
  onDurationTextChange(value: string) {
    this.form.dureeIndicative = value;

    // Essayer d'extraire un nombre en début de chaîne
    const match = value.match(/^(\d+)/);
    if (!match) {
      return;
    }
    const days = Number(match[1]);
    if (!days || days <= 0) {
      return;
    }

    const current = this.form.programme.length;
    if (current < days) {
      for (let i = current + 1; i <= days; i++) {
        this.form.programme.push(this.createEmptyDay(i));
        this.activityFilterText.push('');
      }
    } else if (current > days) {
      this.form.programme = this.form.programme.slice(0, days);
      this.activityFilterText = this.activityFilterText.slice(0, days);
    }

    this.form.programme.forEach((d, i) => d.day = i + 1);
  }

  addDay() {
    const next = this.form.programme.length + 1;
    this.form.programme.push(this.createEmptyDay(next));
    this.activityFilterText.push('');
  }

  removeDay(index: number) {
    if (this.form.programme.length <= 1) return;
    this.form.programme.splice(index, 1);
    this.form.programme.forEach((d, i) => d.day = i + 1);
    this.activityFilterText.splice(index, 1);
  }

  addPointFort() {
    this.form.pointsForts.push({ icon: '', title: '', desc: '' });
  }

  removePointFort(index: number) {
    if (this.form.pointsForts.length <= 1) return;
    this.form.pointsForts.splice(index, 1);
  }

  addPredefinedPointFort(point: CircuitPointFortForm) {
    // Si le premier point fort est encore vide, on le remplace
    if (
      this.form.pointsForts.length === 1 &&
      !this.form.pointsForts[0].icon &&
      !this.form.pointsForts[0].title &&
      !this.form.pointsForts[0].desc
    ) {
      this.form.pointsForts[0] = { ...point };
    } else {
      this.form.pointsForts.push({ ...point });
    }
  }

  addInclus() {
    this.form.inclus.push('');
  }

  removeInclus(index: number) {
    if (this.form.inclus.length <= 1) return;
    this.form.inclus.splice(index, 1);
  }

  addNonInclus() {
    this.form.nonInclus.push('');
  }

  removeNonInclus(index: number) {
    if (this.form.nonInclus.length <= 1) return;
    this.form.nonInclus.splice(index, 1);
  }

  // chargement données de référence
  private loadZones() {
    this.zonesService.getAll().subscribe({
      next: zones => this.zones = zones,
      error: err => console.error('Erreur chargement zones', err)
    });
  }

  private loadVilles() {
    this.villesService.getAll().subscribe({
      next: villes => this.villes = villes,
      error: err => console.error('Erreur chargement villes', err)
    });
  }

  private loadActivites() {
    this.activitesService.getAllActivites().subscribe({
      next: acts => this.activites = acts,
      error: err => console.error('Erreur chargement activités', err)
    });
  }

  onInclusChange(index: number, value: string) {
    this.form.inclus[index] = value;
  }

  onNonInclusChange(index: number, value: string) {
    this.form.nonInclus[index] = value;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  getVillesForZone(zoneId: number | null | undefined): VilleDTO[] {
    if (!zoneId) return this.villes;
    return this.villes.filter(v => v.zoneId === zoneId);
  }

  getActivitiesForVille(villeId: number | null | undefined, filterText: string): Activite[] {
    let acts = this.activites;
    
    // CORRECTION: Filtrer par villeId au lieu de comparaison de strings
    if (villeId) {
      acts = acts.filter(a => a.villeId === villeId);
    }
    
    if (filterText && filterText.trim()) {
      const lowerFilter = filterText.toLowerCase();
      acts = acts.filter(a =>
        a.nom.toLowerCase().includes(lowerFilter) ||
        (a.description && a.description.toLowerCase().includes(lowerFilter))
      );
    }
    return acts;
  }

  onHeroImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.heroImageFile = file;
      this.convertFileToBase64(file)
        .then(b64 => this.heroPreview = b64)
        .catch(() => this.heroPreview = null);
    }
  }

  onGalerieImagesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    if (files.length < 3 || files.length > 10) {
      alert('Veuillez sélectionner entre 3 et 10 images.');
      return;
    }
    this.galerieFiles = files;
    this.galeriePreviews = [];
    Promise.all(files.map(f => this.convertFileToBase64(f).catch(() => null)))
      .then(previews => {
        this.galeriePreviews = previews.filter(Boolean) as string[];
      });
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  toggleActivity(dayIndex: number, activityId: number, checked: boolean) {
    const day = this.form.programme[dayIndex];
    if (!day) return;
    if (!day.activities) day.activities = [];
    if (checked) {
      if (!day.activities.includes(activityId)) day.activities.push(activityId);
    } else {
      day.activities = day.activities.filter(id => id !== activityId);
    }
  }

  isActivitySelected(dayIndex: number, activityId: number): boolean {
    const day = this.form.programme[dayIndex];
    return !!day && !!day.activities && day.activities.includes(activityId);
  }

  /**
   * Filtre géographique intelligent pour les activités
   * Empêche de sélectionner des activités trop éloignées
   */
  getActivitesDisponibles(day: CircuitProgrammeDayForm): Activite[] {
    let disponibles = this.activites;

    // 1. Filtrer par zone du jour
    if (day.zoneId) {
      disponibles = disponibles.filter(a => a.zoneId === day.zoneId);
    }

    // 2. Filtrer par ville du jour (encore plus précis)
    if (day.villeId) {
      disponibles = disponibles.filter(a => a.villeId === day.villeId);
    }

    // 3. Filtrer par texte de recherche
    const filter = this.activityFilterText[day.day - 1]?.toLowerCase().trim();
    if (filter) {
      disponibles = disponibles.filter(a =>
        a.nom.toLowerCase().includes(filter) ||
        (a.description && a.description.toLowerCase().includes(filter))
      );
    }

    return disponibles;
  }

  /**
   * Récupère les villes filtrées par zone pour un jour donné
   */
  getVillesForDay(day: CircuitProgrammeDayForm): VilleDTO[] {
    if (!day.zoneId) {
      return this.villes;
    }
    return this.villes.filter(v => v.zoneId === day.zoneId);
  }

  /**
   * Quand la zone change, réinitialiser ville et activités
   */
  onDayZoneChange(day: CircuitProgrammeDayForm) {
    day.villeId = null;
    day.activities = [];
  }

  /**
   * Quand la ville change, réinitialiser les activités
   */
  onDayVilleChange(day: CircuitProgrammeDayForm) {
    day.activities = [];
  }

  displayConvertedPrice(): string {
    if (this.form.prixIndicatif == null || isNaN(Number(this.form.prixIndicatif))) return '';
    const val = Number(this.form.prixIndicatif);
    if (this.saisirEnCFA) {
      return (val / this.RATE_XOF_PER_EUR).toFixed(2) + ' €';
    }
    return Math.round(val * this.RATE_XOF_PER_EUR).toString() + ' XOF';
  }

  goToStep(step: number) {
    this.currentStep = step;
  }

  nextStep() {
    if (this.currentStep < 4) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  private basicValidate(): boolean {
    return !!this.form.titre && !!this.form.description && !!this.form.dureeIndicative && !!this.form.prixIndicatif;
  }

  async onSubmit() {
    if (!this.basicValidate()) {
      alert('Merci de remplir au minimum titre, description, durée et prix.');
      this.currentStep = 1;
      return;
    }
    if (!this.heroImageFile) {
      alert('Veuillez sélectionner une image principale.');
      this.currentStep = 3;
      return;
    }
    if (this.galerieFiles.length < 3 || this.galerieFiles.length > 10) {
      alert('Veuillez sélectionner entre 3 et 10 images pour la galerie.');
      this.currentStep = 3;
      return;
    }

    this.isLoading = true;
    try {
      if (this.saisirEnCFA) {
        this.form.prixIndicatif = Number(this.form.prixIndicatif) / this.RATE_XOF_PER_EUR;
      }

      const heroRes = await lastValueFrom(this.circuitService.uploadImage(this.heroImageFile, 'circuits/hero'));
      this.form.img = heroRes.url;

      const galerieResults: { filename: string; url: string }[] = [];
      for (const f of this.galerieFiles) {
        const r = await lastValueFrom(this.circuitService.uploadImage(f, 'circuits/galerie'));
        galerieResults.push(r);
      }
      this.form.galerie = galerieResults.map(r => r.url);

      // nettoyer les listes
      this.form.inclus = this.form.inclus.map(s => s.trim()).filter(s => !!s);
      this.form.nonInclus = this.form.nonInclus.map(s => s.trim()).filter(s => !!s);
      this.form.pointsForts = this.form.pointsForts
        .map((p: CircuitPointFortForm) => ({
          icon: (p.icon || '').trim(),
          title: (p.title || '').trim(),
          desc: (p.desc || '').trim()
        }))
        .filter(p => p.icon || p.title || p.desc);

      const payload: any = {
        ...this.form,
        activiteIds: Array.from(new Set(this.form.programme.flatMap(d => d.activities)))
      };

      await lastValueFrom(this.circuitService.createCircuit(payload));
      this.router.navigate(['/admin/circuits']);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la création du circuit.');
      this.isLoading = false;
    }
  }

  cancel() {
    this.router.navigate(['/admin/circuits']);
  }
}
