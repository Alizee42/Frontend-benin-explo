import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Activite } from '../../../../services/activites.service';
import { MediaService } from '../../../../services/media.service';

export interface VilleOption { id: number; nom: string }

@Component({
  standalone: true,
  selector: 'app-activite-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './activite-form.component.html',
  styleUrls: ['./activite-form.component.scss']
})
export class ActiviteFormComponent {
  @Input() activite: Partial<Activite> | null = null;
  @Input() zones: any[] = [];
  @Input() villes: Array<VilleOption & { zoneId?: number | null; zoneNom?: string }> = [];
  @Input() saving = false;
  // Optional list of type options. If parent doesn't provide, use defaults below.
  @Input() typeOptions?: string[];
  // Default types used in the app
  types: string[] = ['Culture', 'Nature', 'Aventure', 'Détente', 'Sport', 'Gastronomie'];
  @Output() save = new EventEmitter<Partial<Activite>>();
  @Output() cancel = new EventEmitter<void>();

  uploading = false;
  uploadError: string | null = null;
  // Duration helpers: hours / minutes for the form
  hours: number = 0;
  minutes: number = 0;
  // selectable hours options (0..24)
  hoursOptions: number[] = Array.from({ length: 25 }, (_, i) => i);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private mediaService: MediaService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activite'] && this.activite) {
      // Durée en heures décimales dans le modèle front
      const dureeHours = Number((this.activite as any).duree ?? 0) || 0;
      this.hours = Math.floor(dureeHours);
      this.minutes = Math.round((dureeHours - this.hours) * 60);
      if (this.minutes === 60) {
        this.hours += 1;
        this.minutes = 0;
      }
      this.syncZoneFromVille();
    }
    // Reset file input to avoid keeping previous file
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSave() {
    if (!this.activite) return;
    // Normalisation des valeurs saisies
    const h = Number(this.hours) || 0;
    const m = Number(this.minutes) || 0;
    const totalMinutes = h * 60 + m;
    const totalHours = totalMinutes / 60;
    (this.activite as any).duree = Math.round(totalHours * 100) / 100;
    this.syncZoneFromVille();
    this.save.emit(this.activite);
  }

  onVilleChange() {
    this.syncZoneFromVille();
  }

  get selectedVilleZoneName(): string {
    const villeId = Number((this.activite as any)?.villeId || 0);
    const ville = this.villes.find(v => v.id === villeId);
    if (!ville) return 'Zone determinee a partir de la ville selectionnee';
    return ville.zoneNom || this.zones.find(z => z.id === ville.zoneId || z.idZone === ville.zoneId)?.nom || 'Zone non definie';
  }

  private syncZoneFromVille() {
    if (!this.activite) return;
    const villeId = Number((this.activite as any).villeId || 0);
    const ville = this.villes.find(v => v.id === villeId);
    if (ville) {
      (this.activite as any).zoneId = ville.zoneId ?? 0;
    } else {
      (this.activite as any).zoneId = 0;
    }
  }

  onFileSelected(ev: any) {
    const file: File = ev.target.files && ev.target.files[0];
    if (!file) return;
    this.uploadError = null;
    this.uploading = true;

    this.mediaService.uploadImage(file).subscribe({
      next: (media) => {
        if (this.activite) {
          (this.activite as any).imagePrincipaleId = media.id;
          (this.activite as any).imagePreview = media.url || null;
        }
        console.log('[ActiviteForm] Image uploaded successfully:', media);
        this.uploading = false;
      },
      error: (err) => {
        this.uploadError = 'Erreur upload image';
        console.error('[ActiviteForm] Upload error:', err);
        this.uploading = false;
      }
    });
  }
}
