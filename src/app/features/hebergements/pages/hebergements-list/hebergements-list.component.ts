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
  currentPage = 1;
  pageSize = 6;
  private currentImageByHebId: Record<number, number> = {};

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
        this.currentPage = 1;
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
      }
    });
  }

  reserver(hebergement: HebergementDTO): void {
    const id = Number((hebergement as any)?.id);
    if (!Number.isFinite(id) || id <= 0) {
      return;
    }
    this.router.navigate(['/reservation-hebergement', id]);
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

      const haystack = [h.nom, h.localisation, h.quartier, h.type, h.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

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
        break;
    }

    return result;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.typeFilter = '';
    this.sortBy = 'recommandes';
    this.currentPage = 1;
  }

  onFiltersChange(): void {
    this.currentPage = 1;
  }

  setTypeFilter(type: string): void {
    this.typeFilter = this.typeFilter === type ? '' : type;
    this.currentPage = 1;
  }

  getTypeCount(type: string): number {
    return (this.hebergements || []).filter(h => h.type === type).length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredHebergements.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginatedHebergements(): HebergementDTO[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredHebergements.slice(start, start + this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getCoverUrl(heb: HebergementDTO): string | null {
    return this.getImageAt(heb, this.getCurrentImageIndex(heb)) || '/assets/images/coucherSoleil.avif';
  }

  getGalleryCount(heb: HebergementDTO): number {
    return (heb?.imageUrls || []).filter(Boolean).length;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const fallback = '/assets/images/coucherSoleil.avif';
    if (img.src && !img.src.endsWith(fallback)) {
      img.src = fallback;
      return;
    }
    img.style.display = 'none';
  }

  getImages(heb: HebergementDTO): string[] {
    const imgs = (heb?.imageUrls || [])
      .map(v => this.normalizeImageUrl(v))
      .filter((v): v is string => !!v);
    return imgs;
  }

  getCurrentImageIndex(heb: HebergementDTO): number {
    const id = Number(heb?.id || 0);
    const images = this.getImages(heb);
    if (images.length === 0) return 0;
    const current = this.currentImageByHebId[id] ?? 0;
    if (current >= images.length) {
      this.currentImageByHebId[id] = 0;
      return 0;
    }
    return current;
  }

  getImageAt(heb: HebergementDTO, index: number): string | null {
    const images = this.getImages(heb);
    if (images.length === 0) return null;
    return images[Math.max(0, Math.min(index, images.length - 1))];
  }

  hasMultipleImages(heb: HebergementDTO): boolean {
    return this.getImages(heb).length > 1;
  }

  prevImage(heb: HebergementDTO, event?: Event): void {
    event?.stopPropagation();
    const images = this.getImages(heb);
    if (images.length <= 1) return;
    const id = Number(heb.id);
    const current = this.getCurrentImageIndex(heb);
    this.currentImageByHebId[id] = (current - 1 + images.length) % images.length;
  }

  nextImage(heb: HebergementDTO, event?: Event): void {
    event?.stopPropagation();
    const images = this.getImages(heb);
    if (images.length <= 1) return;
    const id = Number(heb.id);
    const current = this.getCurrentImageIndex(heb);
    this.currentImageByHebId[id] = (current + 1) % images.length;
  }

  setImage(heb: HebergementDTO, index: number, event?: Event): void {
    event?.stopPropagation();
    const images = this.getImages(heb);
    if (!images.length) return;
    const id = Number(heb.id);
    this.currentImageByHebId[id] = Math.max(0, Math.min(index, images.length - 1));
  }

  private normalizeImageUrl(raw: string | null | undefined): string | null {
    const trimmed = String(raw || '').trim().replace(/\\/g, '/');
    if (!trimmed) return null;
    if (trimmed.startsWith('data:')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    if (/^localhost:\d+\//i.test(trimmed)) return `http://${trimmed}`;
    if (/^uploads\//i.test(trimmed)) return `/${trimmed}`;
    if (/^images\//i.test(trimmed)) return `/${trimmed}`;
    if (/^[a-zA-Z]:\//.test(trimmed)) {
      const idx = trimmed.toLowerCase().indexOf('/uploads/');
      if (idx >= 0) return trimmed.substring(idx);
      return null;
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
}
