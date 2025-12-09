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
  villes: VilleDTO[] = [];
  isLoading = false;
  heroImageFile: File | null = null;
  galerieFiles: File[] = [];
  // Previews
  heroPreview: string | null = null;
  galeriePreviews: string[] = [];
  currentStep = 1;

  // ProgrammeDays for UI editor (structured per day)
  programmeDays: Array<{ day: number; title?: string; approxTime?: string; description: string; mealsIncluded?: string[]; activities?: number[]; location?: string; durationHours?: number }> = [
    { day: 1, description: '', activities: [] }
  ];

  // Available activities to choose from
  availableActivites: Activite[] = [];
  // Flags d'affichage des erreurs par étape
  showErrorsStep1 = false;
  showErrorsStep2 = false;
  showErrorsStep3 = false;


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
      // if items are strings, convert to structured days
      this.programmeDays = this.circuit.programme.map((p: any, idx: number) => {
        if (typeof p === 'string') return { day: idx + 1, description: p, activities: [] };
        return { day: p.day ?? idx + 1, title: p.title, approxTime: p.approxTime, description: p.description ?? '', mealsIncluded: p.mealsIncluded ?? [], activities: p.activities ?? [], location: p.location, durationHours: p.durationHours };
      });
    }
  }

  loadActivites() {
    // load full list of activities so admin can pick per day
    this.activitesService.getAllActivites().subscribe({
      next: (acts) => this.availableActivites = acts,
      error: (err) => console.error('Erreur chargement activités', err)
    });
  }

  /** Retourne la liste d'activités autorisées pour le jour `index` en fonction de la ville/zone */
  getActivitiesForDay(index: number): Activite[] {
    const day = this.programmeDays[index];
    const jourVilleId = (day as any).villeId ?? this.circuit.villeId;
    if (!jourVilleId) return this.availableActivites || [];
    // trouver zone de la ville
    const ville = this.villes.find(v => v.id === jourVilleId) as any;
    const jourZoneId = ville ? ville.zoneId : undefined;
    if (jourZoneId === undefined || jourZoneId === null) return this.availableActivites || [];
    return (this.availableActivites || []).filter(a => a.zoneId === jourZoneId);
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

  loadZones() {
    this.zonesService.getAll().subscribe({
      next: (zones) => {
        this.zones = zones;
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
      },
      error: (error) => {
        console.error('Erreur chargement villes', error);
      }
    });
  }

  goToStep(step: number) {
    console.log('[AddCircuit] goToStep requested:', { from: this.currentStep, to: step });
    // allow direct go only if target is previous or current; if forward, validate intermediate
    if (step > this.currentStep) {
      // validate current step before moving forward
      if (this.currentStep === 1) {
        const ok = this.validateStep1();
        console.log('[AddCircuit] validateStep1 result (goToStep):', ok, this.getStep1Debug());
        if (!ok) { this.showErrorsStep1 = true; return; }
      }
      if (this.currentStep === 2) {
        const ok2 = this.validateStep2();
        console.log('[AddCircuit] validateStep2 result (goToStep):', ok2);
        if (!ok2) { this.showErrorsStep2 = true; return; }
      }
    }
    this.currentStep = step;
  }

  nextStep() {
    console.log('[AddCircuit] nextStep called from', this.currentStep);
    if (this.currentStep < 3) {
      if (this.currentStep === 1) {
        const ok = this.validateStep1();
        console.log('[AddCircuit] validateStep1 result (nextStep):', ok, this.getStep1Debug());
        if (!ok) { this.showErrorsStep1 = true; return; }
        this.showErrorsStep1 = false;
      } else if (this.currentStep === 2) {
        const ok2 = this.validateStep2();
        console.log('[AddCircuit] validateStep2 result (nextStep):', ok2);
        if (!ok2) { this.showErrorsStep2 = true; return; }
        this.showErrorsStep2 = false;
      }
      this.currentStep++;
      console.log('[AddCircuit] moved to step', this.currentStep);
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
      this.showErrorsStep2 = false;
      // generate previews
      this.galeriePreviews = [];
      Promise.all(files.slice(0, 10).map(f => this.convertFileToBase64(f).catch(() => null)))
        .then(previews => {
          this.galeriePreviews = previews.filter(Boolean) as string[];
        }).catch(() => { this.galeriePreviews = []; });
    } else {
      this.galerieFiles = [];
      this.showErrorsStep2 = true;
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
    this.programmeDays.push({ day: nextDay, description: '' });
  }

  removeJour(index: number) {
    if (this.programmeDays.length > 1) {
      this.programmeDays.splice(index, 1);
      // re-number days
      this.programmeDays.forEach((d, i) => d.day = i + 1);
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

  // Validation par étape
  private validateStep1(): boolean {
    const titre = (this.circuit.titre || '').toString().trim();
    const description = (this.circuit.description || '').toString().trim();
    // accept both property names if present (legacy/different bindings)
    const dureeVal = (this.circuit.dureeIndicative ?? (this.circuit as any).duree) || '';
    const duree = dureeVal.toString().trim();
    const prixVal = Number(this.circuit.prixIndicatif);
    const prixOk = !isNaN(prixVal) && prixVal > 0;
    const villeIdRaw = this.circuit.villeId;
    const villeOk = villeIdRaw !== null && villeIdRaw !== undefined && String(villeIdRaw).trim() !== '';

    const okTitre = titre.length > 0;
    const okDescription = description.length > 0;
    const okDuree = duree.length > 0;
    const okPrix = prixOk;
    const okVille = villeOk;
    const result = okTitre && okDescription && okDuree && okPrix && okVille;

    // debug log
    console.log('[AddCircuit] validateStep1 checks:', {
      okTitre, okDescription, okDuree, okPrix, okVille, result,
      circuitSnapshot: {
        titre: this.circuit.titre,
        description: this.circuit.description,
        dureeIndicative: this.circuit.dureeIndicative,
        dureeLegacy: (this.circuit as any).duree,
        prixIndicatif: this.circuit.prixIndicatif,
        villeId: this.circuit.villeId
      }
    });

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
    // hero image and gallery
    const okHero = !!this.heroImageFile;
    const okGalerie = this.galerieFiles && this.galerieFiles.length >= 3 && this.galerieFiles.length <= 10;
    // programme all filled (structured days)
    const okProgramme = this.programmeDays && this.programmeDays.length > 0 && this.programmeDays.every(p => p && p.description && p.description.toString().trim() !== '');

    const result = okHero && okGalerie && okProgramme;
    console.log('[AddCircuit] validateStep2 checks:', { okHero, okGalerie, okProgramme, result });
    return result;
  }

  onSubmit() {
    console.log('Circuit data:', this.circuit);
    console.log('Hero image file:', this.heroImageFile);
    console.log('Galerie files:', this.galerieFiles);

    

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

    // Validation du programme (utilise programmeDays structuré)
    if (!this.programmeDays || this.programmeDays.some(jour => !jour.description || !jour.description.toString().trim())) {
      alert('Veuillez remplir la description pour chaque jour du programme.');
      console.error('Programme incomplet');
      return;
    }

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

    console.log('Toutes les validations passées, envoi au backend...');
    this.isLoading = true;

    (async () => {
      try {
        // 1) uploader l'image principale
        if (!this.heroImageFile) throw new Error('Image principale manquante');
        console.log('[AddCircuit] uploading hero image:', this.heroImageFile.name);
        const heroResp = await lastValueFrom(this.circuitService.uploadImage(this.heroImageFile, 'circuits/hero'));
        console.log('[AddCircuit] hero upload response:', heroResp);
        // backend retourne { filename, url }
        this.circuit.img = `http://localhost:8080${heroResp.url}`;

        // 2) uploader la galerie en parallèle
        console.log('[AddCircuit] uploading gallery images count:', this.galerieFiles.length);
        const galerieResults: Array<{ filename: string; url: string }> = [];
        const failedFiles: Array<{ name: string; error: any }> = [];
        for (const file of this.galerieFiles) {
          try {
            const r = await lastValueFrom(this.circuitService.uploadImage(file, 'circuits/galerie'));
            console.log('[AddCircuit] gallery upload response for', file.name, r);
            galerieResults.push(r);
          } catch (uploadErr) {
            console.error('[AddCircuit] gallery upload failed for', file.name, uploadErr);
            failedFiles.push({ name: file.name, error: uploadErr });
          }
        }

        console.log('[AddCircuit] gallery upload summary successes:', galerieResults.length, 'failures:', failedFiles.length);
        // If some uploads failed, inform the user but continue with the successful ones
        if (failedFiles.length > 0) {
          const names = failedFiles.map(f => f.name).join(', ');
          alert('Certaines images de la galerie n\'ont pas pu être uploadées: ' + names + '. Le circuit sera créé avec les images uploadées. Vous pouvez réessayer pour les fichiers manquants.');
        }

        this.circuit.galerie = galerieResults.map(r => `http://localhost:8080${r.url}`);

        // 3) créer le circuit avec les URLs complètes
        console.log('[AddCircuit] creating circuit payload (legacy string[] programme):', this.circuit);

        // Si l'admin a saisi le prix en XOF (CFA), convertir en EUR avant l'envoi
        if (this.saisirEnCFA && this.circuit.prixIndicatif != null && !isNaN(Number(this.circuit.prixIndicatif))) {
          try {
            this.circuit.prixIndicatif = Number(Number(this.circuit.prixIndicatif) / this.RATE_XOF_PER_EUR);
          } catch (e) {
            console.warn('Conversion prix XOF->EUR failed', e);
          }
        }

        // IMPORTANT : le backend actuel attend un tableau de chaînes pour `programme`
        // (champ `programme` est une String JSON dans l'entité, désérialisée en List<String> dans CircuitService).
        // Pour éviter l'erreur de parse JSON "Cannot deserialize value of type String from Object",
        // on envoie uniquement la description de chaque jour sous forme de string[].
        this.circuit.programme = this.programmeDays.map(d => d.description);

        this.circuitService.createCircuit(this.circuit as Omit<CircuitDTO, 'id'>).subscribe({
          next: (createdCircuit) => {
            console.log('[AddCircuit] Circuit créé:', createdCircuit);
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