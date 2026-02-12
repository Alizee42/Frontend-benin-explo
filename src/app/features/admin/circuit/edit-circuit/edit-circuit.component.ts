import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CircuitDTO, PointFort } from '../../../../models/circuit.dto';
import { CircuitService } from '../../../../services/circuit.service';
import { ZonesService, Zone } from '../../../../services/zones.service';
import { VillesService, VilleDTO } from '../../../../services/villes.service';
import { ActivitesService, Activite } from '../../../../services/activites.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-edit-circuit',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './edit-circuit.component.html',
  styleUrls: ['./edit-circuit.component.scss']
})
export class EditCircuitComponent implements OnInit {
  // Taux fixe approximatif EUR <-> XOF (1 EUR = 655.957 XOF)
  readonly RATE_XOF_PER_EUR = 655.957;
  // Si coché, l'administrateur saisit le prix en XOF (CFA) dans le champ prix;
  // à l'enregistrement on convertira en EUR (valeur envoyée au backend).
  saisirEnCFA = false;
  private previousSaisirEnCFA = false;
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
    pointsForts: [{ icon: '', title: '', desc: '' }],
    inclus: [''],
    nonInclus: ['']
  };
  zones: Zone[] = [];
  villes: VilleDTO[] = [];
  activites: Activite[] = [];
  programmeDays: Array<{
    day: number;
    title?: string;
    zoneId?: number | null;
    villeId?: number | null;
    selectedZoneIds?: number[];
    selectedVilleIds?: number[];
    activities?: number[];
    notes?: string;
  }> = [];
  isLoading = false;
  circuitId: string | null = null;
  heroImageFile: File | null = null;
  galerieFiles: File[] = [];
  // Previews
  heroPreview: string | null = null;
  galeriePreviews: string[] = [];

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
    private router: Router,
    private route: ActivatedRoute,
    private zonesService: ZonesService,
    private villesService: VillesService,
    private activitesService: ActivitesService
  ) {}

  ngOnInit() {
    this.circuitId = this.route.snapshot.paramMap.get('id');
    if (this.circuitId) {
      this.loadCircuit();
    }
    this.loadZones();
    this.loadVilles();
    this.loadActivites();
  }

  loadCircuit() {
    if (!this.circuitId) return;

    this.isLoading = true;
    this.circuitService.getCircuitById(+this.circuitId).subscribe({
      next: (circuit) => {
        this.circuit = circuit;
        // Initialize programmeDays from circuit.programme
        if (this.circuit.programme && this.circuit.programme.length > 0) {
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
              zoneId: p.zoneId ?? this.circuit.zoneId ?? null,
              villeId: p.villeId ?? null,
              selectedZoneIds: (p.zoneId ?? this.circuit.zoneId) != null ? [p.zoneId ?? this.circuit.zoneId] : [],
              selectedVilleIds: p.villeId != null ? [p.villeId] : [],
              activities: p.activities ?? [],
              notes: p.description ?? ''
            };
          });
        } else {
          // Default empty day
          this.programmeDays = [{
            day: 1,
            zoneId: null,
            villeId: null,
            selectedZoneIds: [],
            selectedVilleIds: [],
            activities: [],
            notes: ''
          }];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement circuit', error);
        this.isLoading = false;
        this.router.navigate(['/admin/circuits']);
      }
    });
  }

  loadZones() {
    this.zonesService.getAllZones().subscribe({
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

  loadActivites() {
    this.activitesService.getAllActivites().subscribe({
      next: (activites) => {
        this.activites = activites;
      },
      error: (error) => {
        console.error('Erreur chargement activités', error);
      }
    });
  }

  // Filtrage géographique
  onZoneChange() {
    // Réinitialiser la ville quand la zone change
    this.circuit.villeId = null;
  }

  getFilteredVilles(): VilleDTO[] {
    if (!this.circuit.zoneId) {
      return this.villes;
    }
    return this.villes.filter(v => v.zoneId === this.circuit.zoneId);
  }

  // Gestion des images
  onHeroImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.heroImageFile = file;
      // optional: preview only
      this.convertFileToBase64(file).then(base64 => {
        this.heroPreview = base64;
      }).catch(() => { this.heroPreview = null; });
    }
  }

  onGalerieImagesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    if (files.length >= 1 && files.length <= 10) {
      this.galerieFiles = files;
      // generate previews for selected files
      this.galeriePreviews = [];
      Promise.all(files.slice(0, 10).map(f => this.convertFileToBase64(f).catch(() => null)))
        .then(previews => {
          this.galeriePreviews = previews.filter(Boolean) as string[];
        }).catch(() => { this.galeriePreviews = []; });
    } else {
      alert('Veuillez sélectionner entre 1 et 10 images.');
      event.target.value = '';
    }
  }

  onSaisirEnCFAToggle(checked: boolean) {
    const current = Number(this.circuit.prixIndicatif);
    if (isNaN(current) || checked === this.previousSaisirEnCFA) {
      this.previousSaisirEnCFA = checked;
      return;
    }

    if (checked) {
      // EUR -> XOF for input display
      this.circuit.prixIndicatif = Math.round(current * this.RATE_XOF_PER_EUR);
    } else {
      // XOF -> EUR for input display
      this.circuit.prixIndicatif = Number((current / this.RATE_XOF_PER_EUR).toFixed(2));
    }
    this.previousSaisirEnCFA = checked;
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
    const newDay = this.programmeDays.length + 1;
    this.programmeDays.push({
      day: newDay,
      zoneId: null,
      villeId: null,
      selectedZoneIds: [],
      selectedVilleIds: [],
      activities: [],
      notes: ''
    });
  }

  removeJour(index: number) {
    if (this.programmeDays.length > 1) {
      this.programmeDays.splice(index, 1);
      // Renumber days
      this.programmeDays.forEach((day, i) => day.day = i + 1);
    }
  }

  /**
   * Retourne les villes filtrées par zone
   */
  getVillesForZone(zoneId: number | null | undefined): VilleDTO[] {
    if (!zoneId) return this.villes;
    return this.villes.filter(v => v.zoneId === zoneId);
  }

  /**
   * Retourne les activités filtrées par zone et/ou ville du jour
   */
  getActivitiesForDay(dayIndex: number): Activite[] {
    const day = this.programmeDays[dayIndex];
    if (!day) return this.activites;

    let acts = this.activites;
    
    // 1. Filtrer par zone si sélectionnée
    if (day.zoneId) {
      acts = acts.filter(a => a.zoneId === day.zoneId);
    }
    
    // 2. Filtrer par ville si sélectionnée (plus précis que la zone)
    if (day.villeId) {
      acts = acts.filter(a => a.villeId === day.villeId);
    }
    
    return acts;
  }

  /**
   * Quand la zone change, réinitialiser ville et activités
   */
  onDayZoneChange(dayIndex: number) {
    this.programmeDays[dayIndex].villeId = null;
    this.programmeDays[dayIndex].activities = [];
  }

  /**
   * Quand la ville change, réinitialiser les activités
   */
  onDayVilleChange(dayIndex: number) {
    this.programmeDays[dayIndex].activities = [];
  }

  getActiviteName(actId: number): string {
    const act = this.activites.find(a => a.id === actId);
    return act ? act.nom : 'Activité inconnue';
  }

  addActivityToDay(dayIndex: number, actId: string) {
    if (!actId) return;
    const id = +actId;
    if (!this.programmeDays[dayIndex].activities) {
      this.programmeDays[dayIndex].activities = [];
    }
    if (!this.programmeDays[dayIndex].activities!.includes(id)) {
      this.programmeDays[dayIndex].activities!.push(id);
    }
  }

  removeActivityFromDay(dayIndex: number, actId: number) {
    if (this.programmeDays[dayIndex].activities) {
      this.programmeDays[dayIndex].activities = this.programmeDays[dayIndex].activities!.filter(id => id !== actId);
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
    this.circuit.inclus.push('');
  }

  removeInclus(index: number) {
    if (this.circuit.inclus.length > 1) {
      this.circuit.inclus.splice(index, 1);
    }
  }

  // Gestion des éléments non inclus
  addNonInclus() {
    this.circuit.nonInclus.push('');
  }

  removeNonInclus(index: number) {
    if (this.circuit.nonInclus.length > 1) {
      this.circuit.nonInclus.splice(index, 1);
    }
  }

  // Utilitaire pour le tracking des arrays
  trackByIndex(index: number): number {
    return index;
  }

  // Retourne le prix affiché (converti selon le mode de saisie)
  displayPrice(): number {
    if (!this.circuit || this.circuit.prixIndicatif == null || isNaN(Number(this.circuit.prixIndicatif))) {
      return 0;
    }
    return this.saisirEnCFA
      ? Number(this.circuit.prixIndicatif) / this.RATE_XOF_PER_EUR
      : Number(this.circuit.prixIndicatif) * this.RATE_XOF_PER_EUR;
  }

  // Retourne le prix formaté avec unité (évite les expressions complexes dans le template)
  displayPriceFormatted(): string {
    const value = this.displayPrice();
    if (this.saisirEnCFA) {
      // lorsqu'on saisit en XOF, on affiche la conversion en EUR avec deux décimales
      return value.toFixed(2) + ' €';
    }
    // sinon on affiche en XOF arrondi
    return Math.round(value).toString() + ' XOF';
  }

  onSubmit() {
    this.circuit.programme = this.programmeDays.map(d => ({
      day: d.day,
      description: (d.notes || '').toString().trim(),
      approxTime: undefined,
      mealsIncluded: [],
      activities: d.activities || []
    }));

    if (this.circuit.pointsForts && this.circuit.pointsForts.length > 0) {
      this.circuit.pointsForts = this.circuit.pointsForts.filter(p => {
        const icon = (p.icon || '').toString().trim();
        const title = (p.title || '').toString().trim();
        const desc = (p.desc || '').toString().trim();
        return icon !== '' || title !== '' || desc !== '';
      });
    }

    if (!this.circuit.titre || !this.circuit.description ||
        !this.circuit.dureeIndicative || this.circuit.prixIndicatif == null || 
        isNaN(Number(this.circuit.prixIndicatif))) {
      alert('Veuillez remplir tous les champs obligatoires (titre, description, durée, prix).');
      return;
    }


    // Filtrer les jours de programme vides (rendre optionnel)
    if (this.circuit.programme && this.circuit.programme.length > 0) {
      this.circuit.programme = this.circuit.programme.filter((jour: any) => 
        jour.description && jour.description.toString().trim()
      );
    }

    // Filtrer les points forts incomplets (rendre moins strict)
    if (this.circuit.pointsForts && this.circuit.pointsForts.length > 0) {
      this.circuit.pointsForts = this.circuit.pointsForts.filter(point => {
        const icon = (point.icon || '').toString().trim();
        const title = (point.title || '').toString().trim();
        const desc = (point.desc || '').toString().trim();
        // Garder seulement si au moins le titre est rempli
        return title !== '';
      });
    }

    // Filtrer les éléments vides dans inclus/non inclus
    if (this.circuit.inclus) {
      this.circuit.inclus = this.circuit.inclus.filter((item: string) => item && item.trim());
    }

    if (this.circuit.nonInclus) {
      this.circuit.nonInclus = this.circuit.nonInclus.filter((item: string) => item && item.trim());
    }

    this.isLoading = true;

    (async () => {
      try {
        // If a new hero file was selected, upload it
        if (this.heroImageFile) {
          const heroResp = await lastValueFrom(this.circuitService.uploadImage(this.heroImageFile, 'circuits/hero'));
          this.circuit.img = heroResp.url;
        }

        // If new gallery files selected, upload and append to existing gallery.
        if (this.galerieFiles && this.galerieFiles.length > 0) {
          const existingGalerie = Array.isArray(this.circuit.galerie) ? [...this.circuit.galerie] : [];
          const galerieResults: Array<{ url: string }> = [];
          const failedFiles: Array<{ name: string; error: any }> = [];
          for (const file of this.galerieFiles) {
            try {
              const r = await lastValueFrom(this.circuitService.uploadImage(file, 'circuits/galerie'));
              galerieResults.push(r);
            } catch (uploadErr) {
              console.error('[EditCircuit] gallery upload failed for', file.name, uploadErr);
              failedFiles.push({ name: file.name, error: uploadErr });
            }
          }
          if (failedFiles.length > 0) {
            const names = failedFiles.map(f => f.name).join(', ');
            alert('Certaines images de la galerie n\'ont pas pu être uploadées: ' + names + '. Le circuit sera mis à jour avec les images uploadées. Vous pouvez réessayer pour les fichiers manquants.');
          }
          this.circuit.galerie = Array.from(new Set([...existingGalerie, ...galerieResults.map(r => r.url)]));
        }

        // Build payload without mutating bound form model.
        const payload: CircuitDTO = {
          ...this.circuit,
          galerie: [...(this.circuit.galerie || [])],
          programme: [...(this.circuit.programme as any[] || [])],
          pointsForts: [...(this.circuit.pointsForts || [])],
          inclus: [...(this.circuit.inclus || [])],
          nonInclus: [...(this.circuit.nonInclus || [])]
        };

        if (this.saisirEnCFA && payload.prixIndicatif != null && !isNaN(Number(payload.prixIndicatif))) {
          payload.prixIndicatif = Number((Number(payload.prixIndicatif) / this.RATE_XOF_PER_EUR).toFixed(2));
        }

        // then update the circuit
        this.circuitService.updateCircuit(this.circuit.id, payload).subscribe({
          next: (updatedCircuit) => {
            this.router.navigate(['/admin/circuits']);
          },
          error: (error) => {
            console.error('Erreur mise à jour circuit', error);
            alert('Erreur lors de la mise à jour du circuit. Veuillez réessayer.');
            this.isLoading = false;
          }
        });

      } catch (err: any) {
        console.error('Erreur upload images:', err);
        alert('Erreur lors de l\'upload des images: ' + (err.message || err));
        this.isLoading = false;
      }
    })();
  }

  cancel() {
    this.router.navigate(['/admin/circuits']);
  }
}
