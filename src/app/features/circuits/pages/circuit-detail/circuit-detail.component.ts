import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-circuit-detail',
  imports: [CommonModule],
  templateUrl: './circuit-detail.component.html',
  styleUrls: ['./circuit-detail.component.scss'],
})
export class CircuitDetailComponent {
  circuit = {
    id: 1,
    titre: "Circuit Porto-Novo Tour",
    duree: "1 journée",
    localisation: "Porto-Novo — Département de l’Ouemé",
    resume:
      "Une journée immersive entre lieux Vodoun, musées, nature et balade en pirogue. Un circuit culturel et authentique pour découvrir Porto-Novo autrement.",
    img: "https://images.unsplash.com/photo-1526779248011-7daef7c3e9f4",

    tourisme: [
      "Centre culturel Ouadada",
      "Places Vodoun (Dagbé, Lokossa, Abessan, Yedomin, etc.)",
      "Couvents Vodoun (Sakpata, Gbeloko)",
      "Place Migan",
      "Jardin des plantes & nature",
      "Musée Adandé",
      "Musée Honmè",
    ],

    aventures: [
      "Chasse au trésor — Sentinelle du climat",
      "Découverte du Vodoun Houngbo Sakpata",
      "Tour de la capitale",
      "Balade Rivière Noire",
      "Village lacustre des Aguégués",
      "Potières de Ouémé",
    ],

    programme: [
      "Centre culturel Ouadada",
      "Place Migan",
      "Place Vodoun Adjinan",
      "Jardin des plantes",
      "Tour de la capitale",
      "Pirogue – Rivière noire",
    ],
  };
}
