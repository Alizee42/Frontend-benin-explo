import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-circuit-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './circuit-detail.component.html',
  styleUrls: ['./circuit-detail.component.scss'],
})
export class CircuitDetailComponent implements OnInit {
  circuit: any = null;

  private circuits = [
    {
      id: 1,
      titre: "Ouidah Tour",
      duree: "1 journée",
      localisation: "Ouidah — Porte du retour des esclaves",
      resume: "Un circuit culturel intense retraçant l'histoire du Bénin, entre spiritualité Vodoun, mémoire de l'esclavage et détente en bord de mer.",
      img: "assets/images/esclaves.jpg",
      tourisme: ["Porte du Non Retour", "Temple des Pythons", "Route de l'Esclave", "Musée d'Ouidah", "Basilique de l'Immaculée Conception"],
      aventures: ["Chasse au trésor historique", "Découverte du Vodoun", "Balade en bord de mer", "Rencontre avec les populations locales", "Dégustation de spécialités"],
      programme: ["Accueil et départ de Cotonou", "Visite de la Porte du Non Retour", "Temple des Pythons et rituels Vodoun", "Route de l'Esclave et mémorial", "Musée d'Ouidah et histoire", "Détente en bord de mer et retour"],
      pointsForts: [
        { icon: "🏛️", title: "Histoire & Mémoire", desc: "Découvrez l'histoire de la traite des esclaves et la Porte du Non Retour, symbole de la diaspora africaine." },
        { icon: "🌿", title: "Spiritualité Vodoun", desc: "Immergez-vous dans les rituels ancestraux au Temple des Pythons et explorez la religion traditionnelle béninoise." },
        { icon: "🏖️", title: "Plages & Détente", desc: "Profitez des belles plages d'Ouidah pour une détente bien méritée après les visites culturelles." },
        { icon: "🍲", title: "Cuisine Locale", desc: "Dégustez les spécialités culinaires d'Ouidah, mélange unique de saveurs africaines et européennes." }
      ]
    },
    {
      id: 2,
      titre: "Possotome & Popo Tour",
      duree: "1 journée",
      localisation: "Possotomé & Grand-Popo — Littoral béninois",
      resume: "Une immersion dans la nature, l'artisanat et les traditions du Mono, entre lac, mer et villages authentiques.",
      img: "assets/images/village.jpg",
      tourisme: ["Lac Ahémé", "Village de Possotomé", "Tata Somba", "Musée de la Fondation Zinsou", "Plages de Grand-Popo"],
      aventures: ["Balade en pirogue", "Randonnée dans la nature", "Rencontre avec les pêcheurs", "Découverte de l'artisanat local", "Observation des oiseaux"],
      programme: ["Départ de Cotonou", "Arrivée à Possotomé", "Balade en pirogue sur le lac Ahémé", "Visite du village et artisanat", "Déjeuner traditionnel", "Grand-Popo et plage", "Retour à Cotonou"],
      pointsForts: [
        { icon: "🌊", title: "Lac & Rivière", desc: "Explorez les eaux calmes du lac Ahémé et découvrez la vie lacustre." },
        { icon: "🏞️", title: "Nature Sauvage", desc: "Immergez-vous dans la biodiversité du Mono avec randonnées et observation." },
        { icon: "🎨", title: "Artisanat Local", desc: "Rencontrez les artisans et découvrez les techniques traditionnelles." },
        { icon: "🍛", title: "Cuisine de Mer", desc: "Dégustez les poissons frais et spécialités culinaires du littoral." }
      ]
    },
    {
      id: 3,
      titre: "Abomey Tour",
      duree: "1 journée",
      localisation: "Abomey — Ancienne capitale du royaume du Danxomè",
      resume: "Une plongée dans le royaume du Danxomè : histoire, artisanat, spiritualité et traditions royales.",
      img: "assets/images/royal-palaces-of-abomey.jpg",
      tourisme: ["Palais royaux d'Abomey", "Musée historique", "Place Goho", "Basilique Notre-Dame", "Marché artisanal"],
      aventures: ["Visite guidée des palais", "Découverte des fresques royales", "Rencontre avec les descendants royaux", "Balade dans la ville historique", "Atelier d'artisanat"],
      programme: ["Départ matinal de Cotonou", "Arrivée à Abomey", "Visite des Palais royaux", "Musée et histoire du royaume", "Place Goho et monuments", "Marché et artisanat", "Déjeuner et retour"],
      pointsForts: [
        { icon: "🏰", title: "Histoire Royale", desc: "Découvrez l'histoire fascinante du royaume du Danxomè et ses souverains légendaires." },
        { icon: "🎭", title: "Art & Culture", desc: "Admirez les fresques royales et l'artisanat traditionnel d'Abomey." },
        { icon: "👑", title: "Traditions Royales", desc: "Rencontrez les descendants des rois et apprenez les coutumes ancestrales." },
        { icon: "🛍️", title: "Marché Local", desc: "Explorez le marché artisanal et ramenez des souvenirs authentiques." }
      ]
    },
    {
      id: 4,
      titre: "Colline Tour - Dassa",
      duree: "1 journée",
      localisation: "Dassa-Zoumè — Collines sacrées du Bénin",
      resume: "Un parcours spirituel au cœur des collines sacrées de Dassa, entre collines, grottes et lieux sacrés.",
      img: "assets/images/templepython.jpg",
      tourisme: ["Collines sacrées", "Grotte d'Adjahouin", "Temple de Sakpata", "Village de Dassa", "Musée régional"],
      aventures: ["Randonnée dans les collines", "Exploration des grottes", "Cérémonie spirituelle", "Observation de la faune", "Balade à vélo"],
      programme: ["Départ de Cotonou", "Route vers Dassa", "Randonnée dans les collines sacrées", "Visite de la Grotte d'Adjahouin", "Temple de Sakpata", "Déjeuner traditionnel", "Retour à Cotonou"],
      pointsForts: [
        { icon: "⛰️", title: "Collines Sacrées", desc: "Grimpez les collines mystiques et ressentez l'énergie spirituelle des lieux." },
        { icon: "🕳️", title: "Grottes Mystérieuses", desc: "Explorez les grottes sacrées et découvrez les légendes qui les entourent." },
        { icon: "🙏", title: "Spiritualité", desc: "Participez à des cérémonies traditionnelles et connectez-vous à la nature." },
        { icon: "🚴", title: "Aventure Nature", desc: "Profitez de randonnées et d'activités en plein air dans un cadre préservé." }
      ]
    }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.circuit = this.circuits.find(c => c.id === +id) || this.circuits[0];
    } else {
      this.circuit = this.circuits[0];
    }
  }
}
