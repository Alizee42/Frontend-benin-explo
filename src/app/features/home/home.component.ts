import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CircuitService } from '../../services/circuit.service';
import { CircuitDTO } from '../../models/circuit.dto';

export interface Circuit {
  id: number;
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
export class HomeComponent implements OnInit, OnDestroy {
  heroImages: string[] = [
    'assets/images/coucherSoleil.avif',
    'assets/images/pendjari-national-park.jpg',
    'assets/images/grandPopo.png',
    'assets/images/124905.jpg.webp'
  ];
  currentHero = 0;
  private _timer: any;

  circuits: Circuit[] = [
    { id: 1, title: 'Circuit Decouverte', duration: '3 jours', price: '120 EUR', img: 'assets/images/pendjari-national-park.jpg' },
    { id: 2, title: 'Safari Culturel', duration: '5 jours', price: '240 EUR', img: 'assets/images/royal-palaces-of-abomey.jpg' },
    { id: 3, title: 'Cote et Plages', duration: '4 jours', price: '180 EUR', img: 'assets/images/grandPopo.png' }
  ];

  benefits = [
    { icon: 'assets/icons/guide.svg', title: 'Guides locaux experts', text: 'Guides natifs et passionnes.' },
    { icon: 'assets/icons/authentic.svg', title: 'Circuits authentiques', text: 'Experiences au plus pres des communautes.' },
    { icon: 'assets/icons/booking.svg', title: 'Reservations faciles', text: 'Paiement et support fluide.' }
  ];

  news: Article[] = [
    { title: 'Ouverture nouvelle route', img: 'assets/images/village.jpg' },
    { title: 'Festival culturel 2026', img: 'assets/images/culture.jpg' },
    { title: 'Expeditions nature 2026', img: 'assets/images/elephant.jpg' }
  ];

  constructor(private circuitService: CircuitService) {}

  ngOnInit(): void {
    this._timer = setInterval(() => this.nextHero(), 5000);
    this.loadFeaturedCircuits();
  }

  ngOnDestroy(): void {
    if (this._timer) {
      clearInterval(this._timer);
    }
  }

  nextHero() {
    this.currentHero = (this.currentHero + 1) % this.heroImages.length;
  }

  prevHero() {
    this.currentHero = (this.currentHero - 1 + this.heroImages.length) % this.heroImages.length;
  }

  goToHero(i: number) {
    if (i >= 0 && i < this.heroImages.length) {
      this.currentHero = i;
    }
  }

  private loadFeaturedCircuits(): void {
    this.circuitService.getAllCircuits().subscribe({
      next: (data: CircuitDTO[]) => {
        const source = data || [];
        const actifs = source.filter(c => c?.actif === true);
        const featuredSource = actifs.filter(c => c?.aLaUne === true);
        const featured = (featuredSource.length > 0 ? featuredSource : actifs)
          .slice(0, 4)
          .map(c => ({
            id: c.id,
            title: c.titre,
            duration: c.dureeIndicative || '-',
            price: c.prixIndicatif != null ? `${c.prixIndicatif} EUR` : undefined,
            img: this.resolveImage(c.img)
          }));

        if (featured.length > 0) {
          this.circuits = featured;
        }
      },
      error: () => {
        // fallback: keep local default cards
      }
    });
  }

  private resolveImage(raw?: string): string {
    const value = (raw || '').trim();
    if (!value) {
      return 'assets/images/circuit-default.jpg';
    }
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) {
      return value;
    }
    return value.startsWith('/') ? value : `/${value}`;
  }
}
