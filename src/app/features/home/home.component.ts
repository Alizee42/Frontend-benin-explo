import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CircuitService } from '../../services/circuit.service';
import { CircuitDTO } from '../../models/circuit.dto';
import { ActualiteDTO, ActualitesService } from '../../services/actualites.service';
import { ParametresSiteDTO, ParametresSiteService } from '../../services/parametres-site.service';

export interface Circuit {
  id: number;
  title: string;
  duration: string;
  price?: string;
  img: string;
}

type FeaturedState = 'loading' | 'ready' | 'fallback' | 'empty';
type ContactState = 'loading' | 'ready' | 'unavailable';
type ActualitesState = 'loading' | 'ready' | 'empty' | 'error';

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

  actualitesPreview: ActualiteDTO[] = [];
  actualitesState: ActualitesState = 'loading';
  actualitesNotice = '';

  contactState: ContactState = 'loading';
  contactDetails: ParametresSiteDTO | null = null;

  constructor(
    private circuitService: CircuitService,
    private actualitesService: ActualitesService,
    private parametresSiteService: ParametresSiteService
  ) {}

  ngOnInit(): void {
    this._timer = setInterval(() => this.nextHero(), 5000);
    this.loadFeaturedCircuits();
    this.loadActualitesPreview();
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

  private loadActualitesPreview(): void {
    this.actualitesState = 'loading';
    this.actualitesNotice = '';

    this.actualitesService.getPublished().subscribe({
      next: (items) => {
        this.actualitesPreview = (items || []).slice(0, 3);
        this.actualitesState = this.actualitesPreview.length > 0 ? 'ready' : 'empty';
        if (this.actualitesState === 'empty') {
          this.actualitesNotice = 'Aucune actualite n est publiee pour le moment.';
        }
      },
      error: () => {
        this.actualitesPreview = [];
        this.actualitesState = 'error';
        this.actualitesNotice = 'Les actualites ne sont pas disponibles pour le moment.';
      }
    });
  }

  formatActualiteDate(value?: string | null): string {
    if (!value) {
      return '';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getActualiteExcerpt(actualite: ActualiteDTO, maxLength = 120): string {
    const source = (actualite.resume || actualite.contenu || '').trim();
    if (source.length <= maxLength) {
      return source;
    }
    return `${source.slice(0, maxLength).trim()}...`;
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
