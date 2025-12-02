import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { CircuitDTO, PointFort } from '../../../../models/circuit.dto';
import { CircuitService } from '../../../../services/circuit.service';
import { ZonesService, Zone } from '../../../../services/zones.service';

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
    activiteIds: [],
    img: '',
    galerie: [],
    programme: [''],
    pointsForts: [{ icon: '', title: '', desc: '' }],
    inclus: [''],
    nonInclus: ['']
  };

  zones: Zone[] = [];
  isLoading = false;
  heroImageFile: File | null = null;
  galerieFiles: File[] = [];
  currentStep = 1;

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
    private zonesService: ZonesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadZones();
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

  goToStep(step: number) {
    this.currentStep = step;
  }

  nextStep() {
    if (this.currentStep < 3) {
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
      // Convertir l'image en base64
      this.convertFileToBase64(file).then(base64 => {
        this.circuit.img = base64;
      });
    }
  }

  onGalerieImagesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    if (files.length >= 3 && files.length <= 10) {
      this.galerieFiles = files;
      // Convertir toutes les images en base64
      const promises = files.map(file => this.convertFileToBase64(file));
      Promise.all(promises).then(base64Images => {
        this.circuit.galerie = base64Images;
      });
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
    this.circuit.programme!.push('');
  }

  removeJour(index: number) {
    if (this.circuit.programme!.length > 1) {
      this.circuit.programme!.splice(index, 1);
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

  onSubmit() {
    console.log('Circuit data:', this.circuit);
    console.log('Hero image file:', this.heroImageFile);
    console.log('Galerie files:', this.galerieFiles);

    // Validation des champs obligatoires
    if (!this.circuit.titre || !this.circuit.resume || !this.circuit.description ||
        !this.circuit.dureeIndicative || !this.circuit.prixIndicatif || !this.circuit.localisation) {
      alert('Veuillez remplir tous les champs obligatoires.');
      console.error('Champs obligatoires manquants');
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

    // Validation du programme
    if (this.circuit.programme.some(jour => !jour.trim())) {
      alert('Veuillez remplir tous les jours du programme.');
      console.error('Programme incomplet');
      return;
    }

    // Validation des points forts
    if (this.circuit.pointsForts.some(point => !point.icon.trim() || !point.title.trim() || !point.desc.trim())) {
      alert('Veuillez remplir tous les champs des points forts.');
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

    // Dans un vrai projet, il faudrait d'abord uploader les images
    // Pour l'instant, on simule avec les noms de fichiers
    this.circuitService.createCircuit(this.circuit as Omit<CircuitDTO, 'id'>).subscribe({
      next: (createdCircuit) => {
        console.log('Circuit créé:', createdCircuit);
        this.router.navigate(['/admin/circuits']);
      },
      error: (error) => {
        console.error('Erreur création circuit', error);
        alert('Erreur lors de la création du circuit. Veuillez réessayer.');
        this.isLoading = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/circuits']);
  }
}