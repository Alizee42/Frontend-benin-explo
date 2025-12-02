import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'array' | 'actions' | 'image';
  sortable?: boolean;
  width?: string;
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
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'Aucune donnée disponible';
  @Input() actions: TableAction[] = [];

  @Output() actionClick = new EventEmitter<{action: string, item: any}>();
  @Output() rowClick = new EventEmitter<any>();

  onActionClick(action: string, item: any, event: Event) {
    event.stopPropagation();
    this.actionClick.emit({ action, item });
  }

  onRowClick(item: any) {
    this.rowClick.emit(item);
  }

  getCellValue(item: any, column: TableColumn): any {
    const value = item[column.key];

    switch (column.type) {
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'boolean':
        return value ? 'Oui' : 'Non';
      case 'date':
        return value ? new Date(value).toLocaleDateString('fr-FR') : '';
      default:
        return value;
    }
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

    // URL distante
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) return trimmed;

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
}
