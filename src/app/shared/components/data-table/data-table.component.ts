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
