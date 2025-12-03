import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZonesService, Zone } from '../../../../services/zones.service';

@Component({
  selector: 'app-zone-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zone-form.component.html',
  styleUrls: ['./zone-form.component.scss']
})
export class ZoneFormComponent implements OnChanges {
  @Input() zone: Partial<Zone> | null = null;
  @Output() saved = new EventEmitter<Zone>();
  @Output() cancelled = new EventEmitter<void>();

  model: Partial<Zone> = { nom: '', region: '', description: '', image: '' };
  saving = false;

  constructor(private zonesService: ZonesService) {}

  ngOnChanges(changes: SimpleChanges) {
    this.model = this.zone ? { ...this.zone } : { nom: '', region: '', description: '', image: '' };
  }

  get buttonLabel(): string {
    if (this.saving) return 'Enregistrement...';
    const hasId = !!(this.model && (this.model as any).id);
    return hasId ? 'Mettre à jour' : 'Créer';
  }

  submit() {
    const nom = (this.model.nom || '').toString().trim();
    if (!nom) {
      alert('Le nom de la zone est requis');
      return;
    }
    this.saving = true;
    const payload: any = { nom: nom, description: this.model.description || '' };

    if (this.model && (this.model as any).id) {
      // update
      this.zonesService.updateZone((this.model as any).id, payload).subscribe({
        next: z => { this.saving = false; this.saved.emit(z); },
        error: e => { this.saving = false; console.error(e); alert('Erreur lors de la mise à jour'); }
      });
    } else {
      // create
      this.zonesService.createZone(payload).subscribe({
        next: z => { this.saving = false; this.saved.emit(z); },
        error: e => { this.saving = false; console.error(e); alert('Erreur lors de la création'); }
      });
    }
  }

  cancel() {
    this.cancelled.emit();
  }
}
