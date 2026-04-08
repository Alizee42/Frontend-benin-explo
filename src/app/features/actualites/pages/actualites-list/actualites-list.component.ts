import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActualiteDTO, ActualitesService } from '../../../../services/actualites.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

@Component({
  selector: 'app-actualites-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalComponent],
  templateUrl: './actualites-list.component.html',
  styleUrls: ['./actualites-list.component.scss']
})
export class ActualitesListComponent implements OnInit {
  state: LoadState = 'loading';
  errorMessage = '';
  actualites: ActualiteDTO[] = [];
  selectedActualite: ActualiteDTO | null = null;
  detailOpen = false;

  constructor(private actualitesService: ActualitesService) {}

  ngOnInit(): void {
    this.loadActualites();
  }

  get featuredActualite(): ActualiteDTO | null {
    return this.actualites.length > 0 ? this.actualites[0] : null;
  }

  get otherActualites(): ActualiteDTO[] {
    return this.featuredActualite
      ? this.actualites.filter((item) => item.id !== this.featuredActualite?.id)
      : [];
  }

  openActualite(actualite: ActualiteDTO): void {
    this.selectedActualite = actualite;
    this.detailOpen = true;
  }

  closeActualite(): void {
    this.detailOpen = false;
    this.selectedActualite = null;
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    return parsed.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getExcerpt(actualite: ActualiteDTO, maxLength = 180): string {
    const source = (actualite.resume || actualite.contenu || '').trim();
    if (source.length <= maxLength) {
      return source;
    }
    return `${source.slice(0, maxLength).trim()}...`;
  }

  private loadActualites(): void {
    this.state = 'loading';
    this.errorMessage = '';

    this.actualitesService.getPublished().subscribe({
      next: (items) => {
        this.actualites = items || [];
        this.state = this.actualites.length > 0 ? 'ready' : 'empty';
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les actualites pour le moment.';
        this.state = 'error';
      }
    });
  }
}
