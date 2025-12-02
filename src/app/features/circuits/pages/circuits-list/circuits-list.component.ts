import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CircuitService } from '../../../../services/circuit.service';
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
  loading = true;

  // 🔹 Circuits de démo (utilisés si la BDD est vide ou en erreur)
  private demoCircuits: CircuitDTO[] = [
    {
      id: 1,
      titre: 'Ouidah Tour',
      resume: 'Un circuit culturel intense retraçant l\'histoire du Bénin, entre spiritualité Vodoun, mémoire de l\'esclavage et détente en bord de mer.',
      description: 'Un circuit culturel intense retraçant l\'histoire du Bénin, entre spiritualité Vodoun, mémoire de l\'esclavage et détente en bord de mer.',
      dureeIndicative: '1 journée',
      prixIndicatif: 100,
      formuleProposee: 'circuit',
      localisation: 'Ouidah — Porte du retour des esclaves',
      actif: true,
      zoneId: 1,
      activiteIds: [],
      img: '/assets/images/esclaves.jpg',
      galerie: ['/assets/images/esclaves.jpg', '/assets/images/village.jpg', '/assets/images/royal-palaces-of-abomey.jpg'],
      programme: ['Accueil et départ de Cotonou', 'Visite de la Porte du Non Retour', 'Temple des Pythons et rituels Vodoun', 'Route de l\'Esclave et mémorial', 'Musée d\'Ouidah et histoire', 'Détente en bord de mer et retour'],
      pointsForts: [
        { icon: '🏛️', title: 'Histoire & Mémoire', desc: 'Découvrez l\'histoire de la traite des esclaves et la Porte du Non Retour, symbole de la diaspora africaine.' },
        { icon: '🌿', title: 'Spiritualité Vodoun', desc: 'Immergez-vous dans les rituels ancestraux au Temple des Pythons et explorez la religion traditionnelle béninoise.' },
        { icon: '🏖️', title: 'Plages & Détente', desc: 'Profitez des belles plages d\'Ouidah pour une détente bien méritée après les visites culturelles.' }
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
      localisation: 'Possotomé & Grand-Popo — Littoral béninois',
      actif: true,
      zoneId: 2,
      activiteIds: [],
      img: '/assets/images/village.jpg',
      galerie: ['/assets/images/village.jpg', '/assets/images/esclaves.jpg', '/assets/images/templepython.jpg'],
      programme: ['Départ de Cotonou', 'Arrivée à Possotomé', 'Balade en pirogue sur le lac Ahémé', 'Visite du village et artisanat', 'Déjeuner traditionnel', 'Grand-Popo et plage', 'Retour à Cotonou'],
      pointsForts: [
        { icon: '🌊', title: 'Lac & Rivière', desc: 'Explorez les eaux calmes du lac Ahémé et découvrez la vie lacustre.' },
        { icon: '🏞️', title: 'Nature Sauvage', desc: 'Immergez-vous dans la biodiversité du Mono avec randonnées et observation.' },
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
      localisation: 'Abomey — Ancienne capitale du royaume du Danxomè',
      actif: true,
      zoneId: 3,
      activiteIds: [],
      img: '/assets/images/royal-palaces-of-abomey.jpg',
      galerie: ['/assets/images/royal-palaces-of-abomey.jpg', '/assets/images/esclaves.jpg', '/assets/images/village.jpg'],
      programme: ['Départ matinal de Cotonou', 'Arrivée à Abomey', 'Visite des Palais royaux', 'Musée et histoire du royaume', 'Place Goho et monuments', 'Marché et artisanat', 'Déjeuner et retour'],
      pointsForts: [
        { icon: '🏰', title: 'Histoire Royale', desc: 'Découvrez l\'histoire fascinante du royaume du Danxomè et ses souverains légendaires.' },
        { icon: '🎭', title: 'Art & Culture', desc: 'Admirez les fresques royales et l\'artisanat traditionnel d\'Abomey.' },
        { icon: '👑', title: 'Traditions Royales', desc: 'Rencontrez les descendants des rois et apprenez les coutumes ancestrales.' }
      ],
      inclus: ['Guide historien', 'Transport climatisé', 'Entrées des palais', 'Déjeuner royal'],
      nonInclus: ['Vols domestiques', 'Boissons', 'Photos professionnelles', 'Souvenirs']
    },
    {
      id: 4,
      titre: 'Colline Tour - Dassa',
      resume: 'Un parcours spirituel au cœur des collines sacrées de Dassa, entre collines, grottes et lieux sacrés.',
      description: 'Un parcours spirituel au cœur des collines sacrées de Dassa, entre collines, grottes et lieux sacrés.',
      dureeIndicative: '1 journée',
      prixIndicatif: 110,
      formuleProposee: 'circuit',
      localisation: 'Dassa-Zoumè — Collines sacrées du Bénin',
      actif: true,
      zoneId: 4,
      activiteIds: [],
      img: '/assets/images/templepython.jpg',
      galerie: ['/assets/images/templepython.jpg', '/assets/images/royal-palaces-of-abomey.jpg', '/assets/images/esclaves.jpg'],
      programme: ['Départ de Cotonou', 'Route vers Dassa', 'Randonnée dans les collines sacrées', 'Visite de la Grotte d\'Adjahouin', 'Temple de Sakpata', 'Déjeuner traditionnel', 'Retour à Cotonou'],
      pointsForts: [
        { icon: '⛰️', title: 'Collines Sacrées', desc: 'Grimpez les collines mystiques et ressentez l\'énergie spirituelle des lieux.' },
        { icon: '🕳️', title: 'Grottes Mystérieuses', desc: 'Explorez les grottes sacrées et découvrez les légendes qui les entourent.' },
        { icon: '🙏', title: 'Spiritualité', desc: 'Participez à des cérémonies traditionnelles et connectez-vous à la nature.' }
      ],
      inclus: ['Guide spirituel', 'Transport 4x4', 'Randonnée accompagnée', 'Cérémonie traditionnelle'],
      nonInclus: ['Vols internationaux', 'Repas supplémentaires', 'Offrandes personnelles', 'Assurance']
    }
  ];

  // 🔹 Images associées aux circuits (par id, pour le visuel)
  private imageMap: Record<number, string> = {
    1: '/assets/images/esclaves.jpg',
    2: '/assets/images/village.jpg',
    3: '/assets/images/royal-palaces-of-abomey.jpg',
    4: '/assets/images/templepython.jpg'
  };

  constructor(private circuitService: CircuitService) {}

  ngOnInit(): void {
    this.circuitService.getAllCircuits().subscribe({
      next: (data: CircuitDTO[]) => {
        if (data && data.length > 0) {
          this.circuits = data;
        } else {
          // Si aucun circuit en base → on affiche les circuits de démo
          this.circuits = this.demoCircuits;
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement circuits', err);
        this.circuits = this.demoCircuits;
        this.loading = false;
      }
    });
  }

  getImageForCircuit(circuit: CircuitDTO): string {
    // Utiliser l'image du circuit si elle existe, sinon utiliser le mapping par défaut
    if (circuit.img && circuit.img.trim()) {
      // S'assurer que le chemin commence par /
      return circuit.img.startsWith('/') ? circuit.img : '/' + circuit.img;
    }
    return this.imageMap[circuit.id] || '/assets/images/circuit-default.jpg';
  }

  getShortDescription(circuit: CircuitDTO): string {
    const desc = circuit.description || '';
    return desc.length > 140 ? desc.substring(0, 140) + '…' : desc;
  }
}
