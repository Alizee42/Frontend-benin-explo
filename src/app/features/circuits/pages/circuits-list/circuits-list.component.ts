import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-circuits-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './circuits-list.component.html',
  styleUrls: ['./circuits-list.component.scss']
})
export class CircuitsListComponent {

 circuitsOfficiels = [
  {
    id: 1,
    nom: "Circuit Porto-Novo Tour",
    duree: "1 journée",
    prix: 120,
    excerpt: "Découverte culturelle, lieux Vodoun et aventure autour de Porto-Novo.",
    img: "/assets/images/palais.jpg"
  },
  {
    id: 2,
    nom: "Aventure Sentinelle du Climat",
    duree: "2 heures",
    prix: 15,
    excerpt: "Chasse au trésor éducative dans la nature pour comprendre le climat.",
    img: "/assets/images/marche_assigame.jpeg.webp"
  },
  {
    id: 3,
    nom: "Rivière Noire & Pirogue",
    duree: "4 heures",
    prix: 20,
    excerpt: "Balade en pirogue au cœur de la rivière noire. Nature et immersion totale.",
    img: "/assets/images/pendjari-national-park.jpg"
  }
];
}

