import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CircuitService } from '../../../../services/circuit.service';
import { ZonesService, Zone } from '../../../../services/zones.service';
import { CircuitDTO } from '../../../../models/circuit.dto';
import { PricePipe } from '../../../../shared/pipes/price.pipe';

@Component({
  selector: 'app-circuits-list',
  standalone: true,
  imports: [CommonModule, RouterModule, PricePipe],
  templateUrl: './circuits-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./circuits-list.component.scss']
})
export class CircuitsListComponent implements OnInit {

  // Circuits de la page courante, deja filtres et pagines cote serveur.
  circuits: CircuitDTO[] = [];
  zones: Zone[] = [];
  loading = true;
  selectedZoneId: number | null = null;
  currentPage = 1;
  pageSize = 6;
  totalPages = 1;
  totalCircuitsCount = 0;
  circuitsNotice = '';
  zonesNotice = '';
  usingDemoCircuits = false;

  // Nombre de circuits actifs par zone, pour l'affichage des compteurs de filtre.
  // Recupere via de petits appels pagines (size=1) : seul totalElements nous interesse.
  private circuitsCountByZone: Record<number, number> = {};

  private demoCircuits: CircuitDTO[] = [
    {
      id: 1,
      titre: 'Ouidah Tour',
      resume: 'Un circuit culturel intense retraçant l\'histoire du Bénin, entre spiritualité Vodoun, mémoire de l\'esclavage et détente en bord de mer.',
      description: 'Un circuit culturel intense retraçant l\'histoire du Bénin, entre spiritualité Vodoun, mémoire de l\'esclavage et détente en bord de mer.',
      dureeIndicative: '1 journée',
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
      programme: ['Accueil et départ de Cotonou', 'Visite de la Porte du Non Retour', 'Temple des Pythons et rituels Vodoun', 'Route de l\'Esclave et mémorial', 'Musée d\'Ouidah et histoire', 'Détente en bord de mer et retour'],
      pointsForts: [
        { icon: 'ðŸ›ï¸', title: 'Histoire & Mémoire', desc: 'Découvrez l\'histoire de la traite des esclaves et la Porte du Non Retour, symbole de la diaspora africaine.' },
        { icon: '🌿', title: 'Spiritualité Vodoun', desc: 'Immergez-vous dans les rituels ancestraux au Temple des Pythons et explorez la religion traditionnelle béninoise.' },
        { icon: 'ðŸ–ï¸', title: 'Plages & Détente', desc: 'Profitez des belles plages d\'Ouidah pour une détente bien méritée après les visites culturelles.' }
      ],
      inclus: ['Guide accompagnateur', 'Transport aller-retour', 'Déjeuner traditionnel', 'Entrées des sites'],
      nonInclus: ['Vols internationaux', 'Boissons', 'Dépenses personnelles', 'Assurance voyage']
    },
    {
      id: 2,
      titre: 'Possotome & Popo Tour',
      resume: 'Une immersion dans la nature, l\'artisanat et les traditions du Mono, entre lac, mer et villages authentiques.',
      description: 'Une immersion dans la nature, l\'artisanat et les traditions du Mono, entre lac, mer et villages authentiques.',
      dureeIndicative: '1 journée',
      prixIndicatif: 110,
      formuleProposee: 'circuit',
      localisation: 'Possotomé & Grand-Popo â€” Littoral béninois',
      actif: true,
      zoneId: 2,
      villeId: 6, // Grand-Popo (approximatif)
      villeNom: 'Grand-Popo',
      activiteIds: [],
      img: '/assets/images/village.jpg',
      galerie: ['/assets/images/village.jpg', '/assets/images/esclaves.jpg', '/assets/images/templepython.jpg'],
      programme: ['Départ de Cotonou', 'Arrivée Ã  Possotomé', 'Balade en pirogue sur le lac Ahémé', 'Visite du village et artisanat', 'Déjeuner traditionnel', 'Grand-Popo et plage', 'Retour Ã  Cotonou'],
      pointsForts: [
        { icon: '🌊', title: 'Lac & Rivière', desc: 'Explorez les eaux calmes du lac Ahémé et découvrez la vie lacustre.' },
        { icon: 'ðŸžï¸', title: 'Nature Sauvage', desc: 'Immergez-vous dans la biodiversité du Mono avec randonnées et observation.' },
        { icon: '🎨', title: 'Artisanat Local', desc: 'Rencontrez les artisans et découvrez les techniques traditionnelles.' }
      ],
      inclus: ['Guide local', 'Transport en minibus', 'Balade en pirogue', 'Déjeuner traditionnel'],
      nonInclus: ['Vols internationaux', 'Boissons alcoolisées', 'Achats personnels', 'Pourboires']
    },
    {
      id: 3,
      titre: 'Abomey Tour',
      resume: 'Une plongée dans le royaume du Danxomè : histoire, artisanat, spiritualité et traditions royales.',
      description: 'Une plongée dans le royaume du Danxomè : histoire, artisanat, spiritualité et traditions royales.',
      dureeIndicative: '1 journée',
      prixIndicatif: 110,
      formuleProposee: 'circuit',
      localisation: 'Abomey â€” Ancienne capitale du royaume du Danxomè',
      actif: true,
      zoneId: 3,
      villeId: 7, // Abomey
      villeNom: 'Abomey',
      activiteIds: [],
      img: '/assets/images/royal-palaces-of-abomey.jpg',
      galerie: ['/assets/images/royal-palaces-of-abomey.jpg', '/assets/images/esclaves.jpg', '/assets/images/village.jpg'],
      programme: ['Départ matinal de Cotonou', 'Arrivée Ã  Abomey', 'Visite des Palais royaux', 'Musée et histoire du royaume', 'Place Goho et monuments', 'Marché et artisanat', 'Déjeuner et retour'],
      pointsForts: [
        { icon: 'ðŸ°', title: 'Histoire Royale', desc: 'Découvrez l\'histoire fascinante du royaume du Danxomè et ses souverains légendaires.' },
        { icon: '🎭', title: 'Art & Culture', desc: 'Admirez les fresques royales et l\'artisanat traditionnel d\'Abomey.' },
        { icon: 'ðŸ‘‘', title: 'Traditions Royales', desc: 'Rencontrez les descendants des rois et apprenez les coutumes ancestrales.' }
      ],
      inclus: ['Guide historien', 'Transport climatisé', 'Entrées des palais', 'Déjeuner royal'],
      nonInclus: ['Vols domestiques', 'Boissons', 'Photos professionnelles', 'Souvenirs']
    },
    {
      id: 4,
      titre: 'Colline Tour - Dassa',
      resume: 'Un parcours spirituel au cÅ“ur des collines sacrées de Dassa, entre collines, grottes et lieux sacrés.',
      description: 'Un parcours spirituel au cÅ“ur des collines sacrées de Dassa, entre collines, grottes et lieux sacrés.',
      dureeIndicative: '1 journée',
      prixIndicatif: 110,
      formuleProposee: 'circuit',
      localisation: 'Dassa-Zoumè â€” Collines sacrées du Bénin',
      actif: true,
      zoneId: 4,
      villeId: 10, // Dassa-Zoumè
      villeNom: 'Dassa-Zoumè',
      activiteIds: [],
      img: '/assets/images/templepython.jpg',
      galerie: ['/assets/images/templepython.jpg', '/assets/images/royal-palaces-of-abomey.jpg', '/assets/images/esclaves.jpg'],
      programme: ['Départ de Cotonou', 'Route vers Dassa', 'Randonnée dans les collines sacrées', 'Visite de la Grotte d\'Adjahouin', 'Temple de Sakpata', 'Déjeuner traditionnel', 'Retour Ã  Cotonou'],
      pointsForts: [
        { icon: '⛰️', title: 'Collines Sacrées', desc: 'Grimpez les collines mystiques et ressentez l\'énergie spirituelle des lieux.' },
        { icon: '🕳️', title: 'Grottes Mystérieuses', desc: 'Explorez les grottes sacrées et découvrez les légendes qui les entourent.' },
        { icon: '🙏', title: 'Spiritualité', desc: 'Participez Ã  des cérémonies traditionnelles et connectez-vous Ã  la nature.' }
      ],
      inclus: ['Guide spirituel', 'Transport 4x4', 'Randonnée accompagnée', 'Cérémonie traditionnelle'],
      nonInclus: ['Vols internationaux', 'Repas supplémentaires', 'Offrandes personnelles', 'Assurance']
    }
  ];

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
        this.zones = zones ?? [];
        this.zonesNotice = this.zones.length === 0
          ? 'Les filtres par zone ne sont pas disponibles pour le moment.'
          : '';
        this.loadCircuitsCountByZone();
      },
      error: (error) => {
        this.zones = [];
        this.zonesNotice = 'Les filtres par zone ne sont pas disponibles pour le moment.';
      }
    });
  }

  // Recupere le nombre de circuits actifs par zone via de petits appels pagines
  // (size=1, seul totalElements nous interesse) plutot que de telecharger tout le
  // catalogue pour les compter cote client.
  private loadCircuitsCountByZone(): void {
    if (this.zones.length === 0) {
      return;
    }
    const requests = this.zones.reduce((acc, zone) => {
      acc[zone.idZone] = this.circuitService.getActiveCircuitsPage(0, 1, zone.idZone);
      return acc;
    }, {} as Record<number, ReturnType<CircuitService['getActiveCircuitsPage']>>);

    forkJoin(requests).subscribe({
      next: (results) => {
        const counts: Record<number, number> = {};
        for (const zoneId of Object.keys(results)) {
          counts[+zoneId] = results[+zoneId].totalElements;
        }
        this.circuitsCountByZone = counts;
      },
      error: () => {
        this.circuitsCountByZone = {};
      }
    });
  }

  loadCircuits(): void {
    this.loading = true;
    this.circuitService.getActiveCircuitsPage(this.currentPage - 1, this.pageSize, this.selectedZoneId).subscribe({
      next: (result) => {
        this.usingDemoCircuits = false;
        this.circuits = result.content || [];
        this.totalCircuitsCount = result.totalElements;
        this.totalPages = Math.max(1, result.totalPages);

        this.circuitsNotice = this.circuits.length === 0
          ? (this.selectedZoneId === null
              ? 'Aucun circuit actif n est disponible pour le moment.'
              : '')
          : '';

        this.loading = false;
      },
      error: (err: any) => {
        const demoActifs = this.demoCircuits.filter(c => c?.actif === true);
        this.usingDemoCircuits = true;
        this.circuits = demoActifs;
        this.totalCircuitsCount = demoActifs.length;
        this.totalPages = 1;
        this.currentPage = 1;
        this.circuitsNotice = 'Le catalogue en ligne est temporairement indisponible. Affichage d un apercu local.';
        this.loading = false;
      }
    });
  }

  filterByZone(zoneId: number | null): void {
    this.selectedZoneId = zoneId;
    this.currentPage = 1;
    this.loadCircuits();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCircuits();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCircuits();
    }
  }

  getCircuitsCountForZone(zoneId: number): number {
    return this.circuitsCountByZone[zoneId] ?? 0;
  }

  getImageForCircuit(circuit: CircuitDTO): string {
    if (circuit.img && circuit.img.trim()) {
      const raw = circuit.img.trim();
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
        return raw;
      }
      const img = raw.startsWith('/') ? raw : '/' + raw;
      if (img.startsWith('/images') || img.startsWith('/api/images')) {
        return img;
      }
      return img;
    }
    return this.imageMap[circuit.id] || '/assets/images/circuit-default.jpg';
  }

  getShortDescription(circuit: CircuitDTO): string {
    if (circuit.resume?.trim()) {
      return circuit.resume;
    }
    const desc = circuit.description || '';
    return desc.length > 140 ? desc.substring(0, 140) + '…' : desc;
  }

  trackByCircuitId(_: number, circuit: CircuitDTO): number {
    return circuit.id;
  }

  trackByZoneId(_: number, zone: Zone): number {
    return zone.idZone;
  }
}
