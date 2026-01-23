import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HebergementsService, HebergementDTO } from '../../../../services/hebergements.service';

@Component({
  standalone: true,
  selector: 'app-hebergements-list',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './hebergements-list.component.html',
  styleUrls: ['./hebergements-list.component.scss']
})
export class HebergementsListComponent implements OnInit {
  hebergements: HebergementDTO[] = [];
  loading = true;

  searchTerm = '';
  typeFilter = '';
  sortBy: 'recommandes' | 'prixAsc' | 'prixDesc' | 'alpha' = 'recommandes';

  constructor(private hebergementsService: HebergementsService, private router: Router) {}

  ngOnInit(): void {
    this.loadHebergements();
  }

  loadHebergements(): void {
    this.hebergementsService.getAll().subscribe({
      next: (data: HebergementDTO[]) => {
        this.hebergements = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement hébergements', err);
        this.loading = false;
      }
    });
  }

  reserver(hebergement: HebergementDTO): void {
    // Rediriger vers la page de réservation avec l'ID de l'hébergement
    this.router.navigate(['/reservation-hebergement', hebergement.id]);
  }

  trackById(_: number, item: HebergementDTO): number {
    return item.id;
  }

  get availableTypes(): string[] {
    const types = (this.hebergements || [])
      .map(h => (h.type || '').trim())
      .filter(Boolean);
    return Array.from(new Set(types)).sort((a, b) => a.localeCompare(b));
  }

  get filteredHebergements(): HebergementDTO[] {
    const term = this.searchTerm.trim().toLowerCase();

    let result = (this.hebergements || []).filter(h => {
      const matchesType = !this.typeFilter || h.type === this.typeFilter;
      if (!matchesType) return false;

      if (!term) return true;

      const haystack = [
        h.nom,
        h.localisation,
        h.quartier,
        h.type,
        h.description
      ].filter(Boolean).join(' ').toLowerCase();

      return haystack.includes(term);
    });

    switch (this.sortBy) {
      case 'prixAsc':
        result = result.slice().sort((a, b) => (a.prixParNuit ?? 0) - (b.prixParNuit ?? 0));
        break;
      case 'prixDesc':
        result = result.slice().sort((a, b) => (b.prixParNuit ?? 0) - (a.prixParNuit ?? 0));
        break;
      case 'alpha':
        result = result.slice().sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
        break;
      default:
        // 'recommandes' -> ordre backend
        break;
    }

    return result;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.typeFilter = '';
    this.sortBy = 'recommandes';
  }

  getCoverUrl(heb: HebergementDTO): string | null {
    const first = heb?.imageUrls?.[0];
    if (!first) return null;

    const trimmed = String(first).trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return trimmed;
    return trimmed;
  }

  getGalleryCount(heb: HebergementDTO): number {
    return (heb?.imageUrls || []).filter(Boolean).length;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}