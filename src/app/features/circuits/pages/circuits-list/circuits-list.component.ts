import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CircuitService } from '../../../../services/circuit.service';
import { ZonesService, Zone } from '../../../../services/zones.service';
import { CircuitDTO } from '../../../../models/circuit.dto';

@Component({
  selector: 'app-circuits-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './circuits-list.component.html',
  styleUrls: ['./circuits-list.component.scss']
})
export class CircuitsListComponent implements OnInit {

  circuits: CircuitDTO[] = [];
  allCircuits: CircuitDTO[] = []; // Pour garder tous les circuits
  zones: Zone[] = [];
  loading = true;
  selectedZoneId: number | null = null; // Zone sÃ©lectionnÃ©e pour filtrage
  currentPage = 1;
  pageSize = 6;

  // ðŸ”¹ Circuits de dÃ©mo (utilisÃ©s si la BDD est vide ou en erreur)
  private demoCircuits: CircuitDTO[] = [
    {
      id: 1,
      titre: 'Ouidah Tour',
      resume: 'Un circuit culturel intense retraÃ§ant l\'histoire du BÃ©nin, entre spiritualitÃ© Vodoun, mÃ©moire de l\'esclavage et dÃ©tente en bord de mer.',
      description: 'Un circuit culturel intense retraÃ§ant l\'histoire du BÃ©nin, entre spiritualitÃ© Vodoun, mÃ©moire de l\'esclavage et dÃ©tente en bord de mer.',
      dureeIndicative: '1 journÃ©e',
      prixIndicatif: 100,
      formuleProposee: 'circuit',
      localisation: 'Ouidah â€” Porte du retour des esclaves',
      actif: true,
      zoneId: 1,
      villeId: 3, // Ouidah
      villeNom: 'Ouidah',
      activiteIds: [],
      img: '/assets/images/esclaves.jpg',
      galerie: ['/assets/images/esclaves.jpg', '/assets/images/village.jpg', '/assets/images/royal-palaces-of-abomey.jpg'],
      programme: ['Accueil et dÃ©part de Cotonou', 'Visite de la Porte du Non Retour', 'Temple des Pythons et rituels Vodoun', 'Route de l\'Esclave et mÃ©morial', 'MusÃ©e d\'Ouidah et histoire', 'DÃ©tente en bord de mer et retour'],
      pointsForts: [
        { icon: 'ðŸ›ï¸', title: 'Histoire & MÃ©moire', desc: 'DÃ©couvrez l\'histoire de la traite des esclaves et la Porte du Non Retour, symbole de la diaspora africaine.' },
        { icon: 'ðŸŒ¿', title: 'SpiritualitÃ© Vodoun', desc: 'Immergez-vous dans les rituels ancestraux au Temple des Pythons et explorez la religion traditionnelle bÃ©ninoise.' },
        { icon: 'ðŸ–ï¸', title: 'Plages & DÃ©tente', desc: 'Profitez des belles plages d\'Ouidah pour une dÃ©tente bien mÃ©ritÃ©e aprÃ¨s les visites culturelles.' }
      ],
      inclus: ['Guide accompagnateur', 'Transport aller-retour', 'DÃ©jeuner traditionnel', 'EntrÃ©es des sites'],
      nonInclus: ['Vols internationaux', 'Boissons', 'DÃ©penses personnelles', 'Assurance voyage']
    },
    {
      id: 2,
      titre: 'Possotome & Popo Tour',
      resume: 'Une immersion dans la nature, l\'artisanat et les traditions du Mono, entre lac, mer et villages authentiques.',
      description: 'Une immersion dans la nature, l\'artisanat et les traditions du Mono, entre lac, mer et villages authentiques.',
      dureeIndicative: '1 journÃ©e',
      prixIndicatif: 110,
      formuleProposee: 'circuit',
      localisation: 'PossotomÃ© & Grand-Popo â€” Littoral bÃ©ninois',
      actif: true,
      zoneId: 2,
      villeId: 6, // Grand-Popo (approximatif)
      villeNom: 'Grand-Popo',
      activiteIds: [],
      img: '/assets/images/village.jpg',
      galerie: ['/assets/images/village.jpg', '/assets/images/esclaves.jpg', '/assets/images/templepython.jpg'],
      programme: ['DÃ©part de Cotonou', 'ArrivÃ©e Ã  PossotomÃ©', 'Balade en pirogue sur le lac AhÃ©mÃ©', 'Visite du village et artisanat', 'DÃ©jeuner traditionnel', 'Grand-Popo et plage', 'Retour Ã  Cotonou'],
      pointsForts: [
        { icon: 'ðŸŒŠ', title: 'Lac & RiviÃ¨re', desc: 'Explorez les eaux calmes du lac AhÃ©mÃ© et dÃ©couvrez la vie lacustre.' },
        { icon: 'ðŸžï¸', title: 'Nature Sauvage', desc: 'Immergez-vous dans la biodiversitÃ© du Mono avec randonnÃ©es et observation.' },
        { icon: 'ðŸŽ¨', title: 'Artisanat Local', desc: 'Rencontrez les artisans et dÃ©couvrez les techniques traditionnelles.' }
      ],
      inclus: ['Guide local', 'Transport en minibus', 'Balade en pirogue', 'DÃ©jeuner traditionnel'],
      nonInclus: ['Vols internationaux', 'Boissons alcoolisÃ©es', 'Achats personnels', 'Pourboires']
    },
    {
      id: 3,
      titre: 'Abomey Tour',
      resume: 'Une plongÃ©e dans le royaume du DanxomÃ¨ : histoire, artisanat, spiritualitÃ© et traditions royales.',
      description: 'Une plongÃ©e dans le royaume du DanxomÃ¨ : histoire, artisanat, spiritualitÃ© et traditions royales.',
      dureeIndicative: '1 journÃ©e',
      prixIndicatif: 110,
      formuleProposee: 'circuit',
      localisation: 'Abomey â€” Ancienne capitale du royaume du DanxomÃ¨',
      actif: true,
      zoneId: 3,
      villeId: 7, // Abomey
      villeNom: 'Abomey',
      activiteIds: [],
      img: '/assets/images/royal-palaces-of-abomey.jpg',
      galerie: ['/assets/images/royal-palaces-of-abomey.jpg', '/assets/images/esclaves.jpg', '/assets/images/village.jpg'],
      programme: ['DÃ©part matinal de Cotonou', 'ArrivÃ©e Ã  Abomey', 'Visite des Palais royaux', 'MusÃ©e et histoire du royaume', 'Place Goho et monuments', 'MarchÃ© et artisanat', 'DÃ©jeuner et retour'],
      pointsForts: [
        { icon: 'ðŸ°', title: 'Histoire Royale', desc: 'DÃ©couvrez l\'histoire fascinante du royaume du DanxomÃ¨ et ses souverains lÃ©gendaires.' },
        { icon: 'ðŸŽ­', title: 'Art & Culture', desc: 'Admirez les fresques royales et l\'artisanat traditionnel d\'Abomey.' },
        { icon: 'ðŸ‘‘', title: 'Traditions Royales', desc: 'Rencontrez les descendants des rois et apprenez les coutumes ancestrales.' }
      ],
      inclus: ['Guide historien', 'Transport climatisÃ©', 'EntrÃ©es des palais', 'DÃ©jeuner royal'],
      nonInclus: ['Vols domestiques', 'Boissons', 'Photos professionnelles', 'Souvenirs']
    },
    {
      id: 4,
      titre: 'Colline Tour - Dassa',
      resume: 'Un parcours spirituel au cÅ“ur des collines sacrÃ©es de Dassa, entre collines, grottes et lieux sacrÃ©s.',
      description: 'Un parcours spirituel au cÅ“ur des collines sacrÃ©es de Dassa, entre collines, grottes et lieux sacrÃ©s.',
      dureeIndicative: '1 journÃ©e',
      prixIndicatif: 110,
      formuleProposee: 'circuit',
      localisation: 'Dassa-ZoumÃ¨ â€” Collines sacrÃ©es du BÃ©nin',
      actif: true,
      zoneId: 4,
      villeId: 10, // Dassa-ZoumÃ¨
      villeNom: 'Dassa-ZoumÃ¨',
      activiteIds: [],
      img: '/assets/images/templepython.jpg',
      galerie: ['/assets/images/templepython.jpg', '/assets/images/royal-palaces-of-abomey.jpg', '/assets/images/esclaves.jpg'],
      programme: ['DÃ©part de Cotonou', 'Route vers Dassa', 'RandonnÃ©e dans les collines sacrÃ©es', 'Visite de la Grotte d\'Adjahouin', 'Temple de Sakpata', 'DÃ©jeuner traditionnel', 'Retour Ã  Cotonou'],
      pointsForts: [
        { icon: 'â›°ï¸', title: 'Collines SacrÃ©es', desc: 'Grimpez les collines mystiques et ressentez l\'Ã©nergie spirituelle des lieux.' },
        { icon: 'ðŸ•³ï¸', title: 'Grottes MystÃ©rieuses', desc: 'Explorez les grottes sacrÃ©es et dÃ©couvrez les lÃ©gendes qui les entourent.' },
        { icon: 'ðŸ™', title: 'SpiritualitÃ©', desc: 'Participez Ã  des cÃ©rÃ©monies traditionnelles et connectez-vous Ã  la nature.' }
      ],
      inclus: ['Guide spirituel', 'Transport 4x4', 'RandonnÃ©e accompagnÃ©e', 'CÃ©rÃ©monie traditionnelle'],
      nonInclus: ['Vols internationaux', 'Repas supplÃ©mentaires', 'Offrandes personnelles', 'Assurance']
    }
  ];

  // ðŸ”¹ Images associÃ©es aux circuits (par id, pour le visuel)
  private imageMap: Record<number, string> = {
    1: '/assets/images/esclaves.jpg',
    2: '/assets/images/village.jpg',
    3: '/assets/images/royal-palaces-of-abomey.jpg',
    4: '/assets/images/templepython.jpg'
  };

  constructor(
    private circuitService: CircuitService,
    private zonesService: ZonesService
  ) {}

  ngOnInit(): void {
    this.loadZones();
    this.loadCircuits();
  }

  loadZones(): void {
    this.zonesService.getAllZones().subscribe({
      next: (zones) => {
        this.zones = zones;
      },
      error: (error) => {
        console.error('Erreur chargement zones', error);
      }
    });
  }

  loadCircuits(): void {
    this.circuitService.getAllCircuits().subscribe({
      next: (data: CircuitDTO[]) => {
        const source = data || [];
        const actifs = source.filter(c => c?.actif === true);
        if (source.length > 0) {
          this.allCircuits = actifs;
          this.circuits = actifs;
          this.currentPage = 1;
        } else {
          const demoActifs = this.demoCircuits.filter(c => c?.actif === true);
          this.allCircuits = demoActifs;
          this.circuits = demoActifs;
          this.currentPage = 1;
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement circuits', err);
        const demoActifs = this.demoCircuits.filter(c => c?.actif === true);
        this.allCircuits = demoActifs;
        this.circuits = demoActifs;
        this.currentPage = 1;
        this.loading = false;
      }
    });
  }

  filterByZone(zoneId: number | null): void {
    this.selectedZoneId = zoneId;
    this.currentPage = 1;
    if (zoneId === null) {
      this.circuits = this.allCircuits;
    } else {
      this.circuits = this.allCircuits.filter(circuit => circuit.zoneId === zoneId);
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil((this.circuits?.length || 0) / this.pageSize));
  }

  get pagedCircuits(): CircuitDTO[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return (this.circuits || []).slice(start, start + this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  getCircuitsCountForZone(zoneId: number): number {
    return this.allCircuits.filter(circuit => circuit.zoneId === zoneId).length;
  }

  getImageForCircuit(circuit: CircuitDTO): string {
    // Utiliser l'image du circuit si elle existe, sinon utiliser le mapping par dÃ©faut
    if (circuit.img && circuit.img.trim()) {
      const raw = circuit.img.trim();
      // Si c'est dÃ©jÃ  une URL absolue (http/https) -> retourner telle quelle
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
        return raw;
      }
      // S'assurer que le chemin commence par '/'
      const img = raw.startsWith('/') ? raw : '/' + raw;
      // Si l'URL pointe vers le endpoint backend (/images/...), prÃ©fixer avec l'hÃ´te backend
      if (img.startsWith('/images') || img.startsWith('/api/images')) {
        return img;
      }
      return img;
    }
    return this.imageMap[circuit.id] || '/assets/images/circuit-default.jpg';
  }

  getShortDescription(circuit: CircuitDTO): string {
    const desc = circuit.description || '';
    return desc.length > 140 ? desc.substring(0, 140) + 'â€¦' : desc;
  }
}
