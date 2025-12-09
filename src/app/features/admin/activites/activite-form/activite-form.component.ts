import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Activite } from '../../../../services/activites.service';
import { HttpClient } from '@angular/common/http';

export interface VilleOption { id: number; nom: string }

@Component({
  standalone: true,
  selector: 'app-activite-form',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './activite-form.component.html',
  styleUrls: ['./activite-form.component.scss']
})
export class ActiviteFormComponent {
  @Input() activite: Partial<Activite> | null = null;
  @Input() zones: any[] = [];
  @Input() villes: VilleOption[] = [];
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

  constructor(private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activite'] && this.activite) {
      // activite.duree is expressed in hours (decimal) in the frontend model
      const dureeHours = (this.activite as any).duree ?? 0;
      this.hours = Math.floor(dureeHours);
      this.minutes = Math.round((dureeHours - this.hours) * 60);
      // if the source is a decimal user may prefer direct input; keep enterAsDecimal false by default
    }
  }

  onSave() {
    if (!this.activite) return;
    // compute decimal hours from hours + minutes
    const totalHours = (Number(this.hours) || 0) + ((Number(this.minutes) || 0) / 60);
    (this.activite as any).duree = Math.round(totalHours * 100) / 100; // keep 2 decimals
    this.save.emit(this.activite);
  }

  onFileSelected(ev: any) {
    const file: File = ev.target.files && ev.target.files[0];
    if (!file) return;
    this.uploadError = null;
    this.uploading = true;
    const fd = new FormData();
    fd.append('file', file);

    // Upload the file first, then create a media entry and store both id and preview URL
    this.http.post<any>('http://localhost:8080/api/images/upload', fd).subscribe({
      next: (res) => {
        // res contains { filename, url }
        const uploadedUrl = res?.url || res?.filename || null;
        const media = { url: uploadedUrl, type: 'image', description: '' };
        this.http.post<any>('http://localhost:8080/api/media', media).subscribe({
          next: (m) => {
            if (this.activite) {
              (this.activite as any).imagePrincipaleId = m.id;
              // store a preview url on the activite object for immediate UI preview
              let preview = m.url || uploadedUrl || null;
              // if backend returns a root-relative path like '/images/..', prefix dev host
              if (preview && typeof preview === 'string' && preview.startsWith('/')) {
                preview = 'http://localhost:8080' + preview;
              }
              (this.activite as any).imagePreview = preview;
            }
            this.uploading = false;
          },
          error: (err) => { this.uploadError = 'Erreur création média'; console.error(err); this.uploading = false; }
        });
      },
      error: (err) => { this.uploadError = 'Erreur upload image'; console.error(err); this.uploading = false; }
    });
  }
}
