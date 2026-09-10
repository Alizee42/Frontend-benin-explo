import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

import { CircuitFormData } from '../circuit-form.types';
import { validateImageFiles } from '../../../../../shared/utils/image-upload-validation';

// Duplique le pattern d'upload/preview deja present dans edit-circuit.component.ts
// (composant non eclate, non touche ici) -- candidat a extraire en composant partage
// (ex. ImageDropzoneComponent) si un troisieme cas d'usage apparait.
@Component({
  selector: 'app-add-circuit-step2',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './add-circuit-step2.component.html',
  styleUrl: '../add-circuit-steps.scss'
})
export class AddCircuitStep2Component {
  @Input() circuit!: CircuitFormData;
  @Input() errors: { [key: string]: string } = {};
  @Input() previewHero: string | null = null;
  @Input() previewsGalerie: string[] = [];
  @Output() heroSelected = new EventEmitter<{ file: File; preview: string }>();
  @Output() galerieSelected = new EventEmitter<{ files: File[]; previews: string[] }>();
  @Output() galerieInvalid = new EventEmitter<{ count: number }>();
  @Output() imageInvalid = new EventEmitter<{ message: string }>();
  @Output() galerieImageRemoved = new EventEmitter<number>();

  dragOverHero = false;
  dragOverGalerie = false;

  onHeroSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.processHeroFile(file);
  }

  onHeroDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverHero = true;
  }

  onHeroDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverHero = false;
  }

  onHeroDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverHero = false;
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    this.processHeroFile(file);
  }

  onGalerieSelect(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []) as File[];
    this.processGalerieFiles(files);
  }

  onGalerieDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverGalerie = true;
  }

  onGalerieDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverGalerie = false;
  }

  onGalerieDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverGalerie = false;
    const files = Array.from(event.dataTransfer?.files ?? []) as File[];
    if (files.length === 0) return;
    this.processGalerieFiles(files);
  }

  private async processHeroFile(file: File): Promise<void> {
    const error = await validateImageFiles([file]);
    if (error) {
      this.imageInvalid.emit({ message: error.message });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.heroSelected.emit({ file, preview: reader.result as string });
    reader.readAsDataURL(file);
  }

  private async processGalerieFiles(files: File[]): Promise<void> {
    if (files.length < 3 || files.length > 10) {
      this.galerieInvalid.emit({ count: files.length });
      return;
    }

    const error = await validateImageFiles(files);
    if (error) {
      this.imageInvalid.emit({ message: error.message });
      return;
    }

    // Tableau pre-dimensionne indexe par position (pas push) : les FileReader ne
    // resolvent pas forcement dans l'ordre de selection, et la suppression par index
    // (galerieImageRemoved) exige que previews[i] corresponde bien a files[i].
    const previews: string[] = new Array(files.length);
    let loaded = 0;
    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        previews[idx] = reader.result as string;
        if (++loaded === files.length) {
          this.galerieSelected.emit({ files, previews });
        }
      };
      reader.readAsDataURL(file);
    });
  }
}
