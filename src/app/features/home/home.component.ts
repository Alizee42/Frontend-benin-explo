import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface Circuit {
  title: string;
  duration: string;
  price?: string;
  img: string;
}

export interface Article {
  title: string;
  img: string;
  excerpt?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  heroImages: string[] = [
    'assets/images/coucherSoleil.avif',
    'assets/images/pendjari-national-park.jpg',
    'assets/images/grandPopo.png',
    'assets/images/124905.jpg.webp'
  ];
  currentHero = 0;
  private _timer: any;

  circuits: Circuit[] = [
    { title: 'Circuit Découverte', duration: '3 jours', price: '€120', img: 'assets/images/pendjari-national-park.jpg' },
    { title: 'Safari Culturel', duration: '5 jours', price: '€240', img: 'assets/images/royal-palaces-of-abomey.jpg' },
    { title: 'Côte & Plages', duration: '4 jours', price: '€180', img: 'assets/images/grandPopo.png' }
  ];

  benefits = [
    { icon: 'assets/icons/guide.svg', title: 'Guides locaux experts', text: 'Guides natifs et passionnés.' },
    { icon: 'assets/icons/authentic.svg', title: 'Circuits authentiques', text: 'Expériences au plus près des communautés.' },
    { icon: 'assets/icons/booking.svg', title: 'Réservations faciles', text: 'Paiement et support fluide.' }
  ];

  news: Article[] = [
    { title: 'Ouverture nouvelle route', img: 'assets/images/village.jpg' },
    { title: 'Festival culturel 2026', img: 'assets/images/culture.jpg' },
    { title: 'Expéditions nature 2026', img: 'assets/images/elephant.jpg' }
  ];
  ngOnInit(): void {
    // auto-advance every 5 seconds
    this._timer = setInterval(() => this.nextHero(), 5000);
  }

  ngOnDestroy(): void {
    if (this._timer) { clearInterval(this._timer); }
  }

  nextHero() {
    this.currentHero = (this.currentHero + 1) % this.heroImages.length;
  }

  prevHero() {
    this.currentHero = (this.currentHero - 1 + this.heroImages.length) % this.heroImages.length;
  }

  goToHero(i: number) {
    if (i >= 0 && i < this.heroImages.length) { this.currentHero = i; }
  }
}
