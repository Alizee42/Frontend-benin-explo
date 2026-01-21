import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'array' | 'actions' | 'image' | 'status';
  sortable?: boolean;
  width?: string;
  formatter?: (value: any) => string;
}

export interface TableAction {
  label: string;
  icon?: string;
  class?: string;
  action: string;
  condition?: (item: any) => boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'Aucune donnée disponible';
  @Input() actions: TableAction[] = [];
  @Input() rowClickable = false;
  // Pagination (client-side). If `pageable` is true, the table slices the provided `data`.
  @Input() pageable = false;
  @Input() pageSize = 10;

  @Output() actionClick = new EventEmitter<{action: string, item: any}>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<{page: number, pageSize: number}>();

  // pagination state
  currentPage = 1;
  // expose Math to the template for helpers like Math.min
  public Math = Math;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && !changes['data'].firstChange) {
      this.currentPage = 1;
    }
  }

  onActionClick(action: string, item: any, event: Event) {
    event.stopPropagation();
    this.actionClick.emit({ action, item });
  }

  onRowClick(item: any) {
    this.rowClick.emit(item);
  }

  getCellValue(item: any, column: TableColumn): any {
    const value = this.getNested(item, column.key);

    if (value === null || value === undefined || value === '') return '-';

    switch (column.type) {
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'boolean':
        return value ? 'Oui' : 'Non';
      case 'date':
        return this.formatDateValue(value);
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('fr-FR') : value;
      default:
        return value;
    }
  }

  private formatDateValue(value: any): string {
    const date = this.parseDate(value);
    if (!date) return '-';
    return date.toLocaleDateString('fr-FR');
  }

  private parseDate(value: any): Date | null {
    if (value === null || value === undefined || value === '') return null;

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      // dd/MM/yyyy
      const frMatch = /^([0-3]\d)\/([0-1]\d)\/(\d{4})$/.exec(trimmed);
      if (frMatch) {
        const day = Number(frMatch[1]);
        const month = Number(frMatch[2]);
        const year = Number(frMatch[3]);
        const date = new Date(year, month - 1, day);
        return Number.isNaN(date.getTime()) ? null : date;
      }

      // Fallback (ISO 8601, RFC 2822, etc.)
      const date = new Date(trimmed);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    // last resort
    try {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  // Support nested keys like 'zone.nom' to access nested object properties
  private getNested(obj: any, key: string): any {
    if (!obj || !key) return null;
    if (key.indexOf('.') === -1) return obj[key];
    const parts = key.split('.');
    let cur = obj;
    for (const p of parts) {
      if (cur == null) return null;
      cur = cur[p];
    }
    return cur;
  }

  /**
   * Retourne une source d'image utilisable pour l'attribut `src`.
   * Si la valeur est déjà une data URL ou une URL http(s), on la retourne telle quelle.
   * Si c'est une chaîne Base64 sans préfixe, on ajoute un préfixe `data:image/jpeg;base64,`.
   */
  getImageSrc(value: any): string | null {
    if (!value) return null;

    if (typeof value !== 'string') return null;

    const trimmed = value.trim();

    // Déjà une data URL
    if (trimmed.startsWith('data:')) return trimmed;

    // URL distante absolue
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

    // URL relative (commence par '/') -> prefixer l'API backend en dev
    if (trimmed.startsWith('/')) return `http://localhost:8080${trimmed}`;

    // Si ressemble à du base64 (commence par /9j/ pour JPEG ou iVBORw0KGgo pour PNG)
    const jpegStart = trimmed.startsWith('/9j/');
    const pngStart = trimmed.startsWith('iVBORw0KGgo');
    const maybeBase64 = /^[A-Za-z0-9+/=\s]+$/.test(trimmed);

    if (jpegStart || pngStart || maybeBase64) {
      // Par défaut on suppose JPEG si non déterminé
      return 'data:image/jpeg;base64,' + trimmed;
    }

    return null;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const cell = img.parentElement;
    if (cell) {
      const noImageDiv = cell.querySelector('.no-image') as HTMLElement;
      if (noImageDiv) {
        noImageDiv.style.display = 'flex';
      }
    }
  }

  isActionVisible(action: TableAction, item: any): boolean {
    return !action.condition || action.condition(item);
  }

  get totalPages(): number {
    if (!this.pageable) return 1;
    return Math.max(1, Math.ceil((this.data || []).length / (this.pageSize || 10)));
  }

  // returns the array of items to render for the current page
  get pagedData(): any[] {
    if (!this.pageable) return this.data || [];
    const start = (this.currentPage - 1) * this.pageSize;
    return (this.data || []).slice(start, start + this.pageSize);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.pageChange.emit({ page: this.currentPage, pageSize: this.pageSize });
  }

  prevPage() { this.changePage(this.currentPage - 1); }
  nextPage() { this.changePage(this.currentPage + 1); }

  // Image preview (lightbox) state
  imageModalOpen = false;
  imageModalUrl: string | null = null;

  openImage(url: string | null) {
    if (!url) return;
    // Prefer absolute or data URLs; if relative path starting with '/', prefix to dev backend
    const resolved = (url.startsWith('http') || url.startsWith('data:')) ? url : `http://localhost:8080${url}`;
    this.imageModalUrl = resolved;
    this.imageModalOpen = true;
  }

  closeImage() {
    this.imageModalOpen = false;
    this.imageModalUrl = null;
  }

  onImageClick(event: Event, url: string | null) {
    // prevent row click from firing (which opens edit modal)
    event.stopPropagation();
    this.openImage(url);
  }
}
