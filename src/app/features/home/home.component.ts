import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CircuitService } from '../../services/circuit.service';
import { CircuitDTO } from '../../models/circuit.dto';
import { ParametresSiteDTO, ParametresSiteService } from '../../services/parametres-site.service';

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

type FeaturedState = 'loading' | 'ready' | 'fallback' | 'empty';
type ContactState = 'loading' | 'ready' | 'unavailable';

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

  private readonly fallbackCircuits: Circuit[] = [
    { id: 1, title: 'Circuit Decouverte', duration: '3 jours', price: '120 EUR', img: 'assets/images/pendjari-national-park.jpg' },
    { id: 2, title: 'Safari Culturel', duration: '5 jours', price: '240 EUR', img: 'assets/images/royal-palaces-of-abomey.jpg' },
    { id: 3, title: 'Cote et Plages', duration: '4 jours', price: '180 EUR', img: 'assets/images/grandPopo.png' }
  ];
  circuits: Circuit[] = [...this.fallbackCircuits];
  featuredState: FeaturedState = 'loading';
  featuredNotice = '';

  benefits = [
    { icon: 'assets/icons/guide.svg', title: 'Guides locaux experts', text: 'Guides natifs et passionnes.' },
    { icon: 'assets/icons/authentic.svg', title: 'Circuits authentiques', text: 'Experiences au plus pres des communautes.' },
    { icon: 'assets/icons/booking.svg', title: 'Reservations faciles', text: 'Paiement et support fluide.' }
  ];

  news: Article[] = [
    {
      title: 'Ouidah, entre memoire et littoral',
      img: 'assets/images/village.jpg',
      excerpt: 'Idees de parcours pour meler culture, artisanat et respiration oceanique.'
    },
    {
      title: 'Festivals et saisons culturelles',
      img: 'assets/images/culture.jpg',
      excerpt: 'Quelques temps forts pour organiser un voyage plus vivant et plus local.'
    },
    {
      title: 'Pendjari, nature et rythme juste',
      img: 'assets/images/elephant.jpg',
      excerpt: 'Quand partir, combien de jours prevoir et comment equilibrer safari et decouverte.'
    }
  ];

  contactState: ContactState = 'loading';
  contactDetails: ParametresSiteDTO | null = null;

  constructor(
    private circuitService: CircuitService,
    private parametresSiteService: ParametresSiteService
  ) {}

  ngOnInit(): void {
    this._timer = setInterval(() => this.nextHero(), 5000);
    this.loadFeaturedCircuits();
    this.loadContactDetails();
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
    this.featuredState = 'loading';
    this.featuredNotice = '';

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
          this.featuredState = 'ready';
          return;
        }

        this.circuits = [];
        this.featuredState = 'empty';
        this.featuredNotice = 'Aucun circuit n est publie pour le moment.';
      },
      error: () => {
        this.circuits = [...this.fallbackCircuits];
        this.featuredState = 'fallback';
        this.featuredNotice = 'Connexion au catalogue indisponible. Une selection temporaire est affichee.';
      }
    });
  }

  private loadContactDetails(): void {
    this.contactState = 'loading';

    this.parametresSiteService.getPrimary().subscribe({
      next: (details) => {
        const hasContactData = !!(
          details?.emailContact?.trim() ||
          details?.telephoneContact?.trim() ||
          details?.adresseAgence?.trim()
        );

        this.contactDetails = hasContactData ? details : null;
        this.contactState = hasContactData ? 'ready' : 'unavailable';
      },
      error: () => {
        this.contactDetails = null;
        this.contactState = 'unavailable';
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

  get contactEmailHref(): string | null {
    const email = this.contactDetails?.emailContact?.trim();
    return email ? `mailto:${email}` : null;
  }

  get contactPhoneHref(): string | null {
    const phone = this.contactDetails?.telephoneContact?.trim();
    if (!phone) {
      return null;
    }

    const normalized = phone.replace(/\s+/g, '');
    return `tel:${normalized}`;
  }
}
