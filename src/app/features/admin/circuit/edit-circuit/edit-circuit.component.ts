import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CircuitDTO, PointFort } from '../../../../models/circuit.dto';
import { CircuitService } from '../../../../services/circuit.service';
import { ZonesService, Zone } from '../../../../services/zones.service';
import { VillesService, VilleDTO } from '../../../../services/villes.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-edit-circuit',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './edit-circuit.component.html',
  styleUrls: ['./edit-circuit.component.scss']
})
export class EditCircuitComponent implements OnInit {
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
  isLoading = false;
  circuitId: string | null = null;
  heroImageFile: File | null = null;
  galerieFiles: File[] = [];

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
    private villesService: VillesService
  ) {}

  ngOnInit() {
    this.circuitId = this.route.snapshot.paramMap.get('id');
    if (this.circuitId) {
      this.loadCircuit();
    }
    this.loadZones();
    this.loadVilles();
  }

  loadCircuit() {
    if (!this.circuitId) return;

    this.isLoading = true;
    this.circuitService.getCircuitById(+this.circuitId).subscribe({
      next: (circuit) => {
        this.circuit = circuit;
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

  // Gestion des images
  onHeroImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.heroImageFile = file;
      // optional: preview only
    }
  }

  onGalerieImagesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    if (files.length >= 3 && files.length <= 10) {
      this.galerieFiles = files;
    } else {
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
    this.circuit.programme.push('');
  }

  removeJour(index: number) {
    if (this.circuit.programme.length > 1) {
      this.circuit.programme.splice(index, 1);
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

  onSubmit() {
    // Nettoyage: supprimer les points forts complètement vides (utilisateur n'a pas rempli les champs)
    if (this.circuit.pointsForts && this.circuit.pointsForts.length > 0) {
      this.circuit.pointsForts = this.circuit.pointsForts.filter(p => {
        const icon = (p.icon || '').toString().trim();
        const title = (p.title || '').toString().trim();
        const desc = (p.desc || '').toString().trim();
        return icon !== '' || title !== '' || desc !== '';
      });
    }

    // Validation des champs obligatoires
    if (!this.circuit.titre || !this.circuit.resume || !this.circuit.description ||
        !this.circuit.dureeIndicative || !this.circuit.prixIndicatif || !this.circuit.localisation) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Validation des images (optionnel en édition)
    // Validation du programme (compatible string[] ou ProgrammeDay[])
    if (this.circuit.programme.some(jour => {
      if (typeof jour === 'string') return !jour.trim();
      // object case: check description field
      return !(jour.description && jour.description.toString().trim());
    })) {
      alert('Veuillez remplir tous les jours du programme.');
      return;
    }

    // Validation des points forts
    if (this.circuit.pointsForts.some(point => !point.icon.trim() || !point.title.trim() || !point.desc.trim())) {
      alert('Veuillez remplir tous les champs des points forts.');
      return;
    }

    // Validation des inclusions
    if (this.circuit.inclus.some(item => !item.trim())) {
      alert('Veuillez remplir tous les éléments inclus.');
      return;
    }

    if (this.circuit.nonInclus.some(item => !item.trim())) {
      alert('Veuillez remplir tous les éléments non inclus.');
      return;
    }

    this.isLoading = true;

    (async () => {
      try {
        // If a new hero file was selected, upload it
        if (this.heroImageFile) {
          console.log('[EditCircuit] uploading hero image:', this.heroImageFile.name);
          const heroResp = await lastValueFrom(this.circuitService.uploadImage(this.heroImageFile, 'circuits/hero'));
          console.log('[EditCircuit] hero upload response:', heroResp);
          this.circuit.img = `http://localhost:8080${heroResp.url}`;
        }

        // If new gallery files selected, upload them (sequential, resilient)
        if (this.galerieFiles && this.galerieFiles.length > 0) {
          console.log('[EditCircuit] uploading gallery images count:', this.galerieFiles.length);
          const galerieResults: Array<{ filename: string; url: string }> = [];
          const failedFiles: Array<{ name: string; error: any }> = [];
          for (const file of this.galerieFiles) {
            try {
              const r = await lastValueFrom(this.circuitService.uploadImage(file, 'circuits/galerie'));
              console.log('[EditCircuit] gallery upload response for', file.name, r);
              galerieResults.push(r);
            } catch (uploadErr) {
              console.error('[EditCircuit] gallery upload failed for', file.name, uploadErr);
              failedFiles.push({ name: file.name, error: uploadErr });
            }
          }
          console.log('[EditCircuit] gallery upload summary successes:', galerieResults.length, 'failures:', failedFiles.length);
          if (failedFiles.length > 0) {
            const names = failedFiles.map(f => f.name).join(', ');
            alert('Certaines images de la galerie n\'ont pas pu être uploadées: ' + names + '. Le circuit sera mis à jour avec les images uploadées. Vous pouvez réessayer pour les fichiers manquants.');
          }
          this.circuit.galerie = galerieResults.map(r => `http://localhost:8080${r.url}`);
        }

        // then update the circuit
        this.circuitService.updateCircuit(this.circuit.id, this.circuit).subscribe({
          next: (updatedCircuit) => {
            console.log('Circuit mis à jour:', updatedCircuit);
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