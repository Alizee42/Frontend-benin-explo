import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

import { CircuitFormData } from '../circuit-form.types';
import { validateImageFiles } from '../../../../../shared/utils/image-upload-validation';

@Component({
  selector: 'app-add-circuit-step2',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './add-circuit-step2.component.html'
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

  async onHeroSelect(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const error = await validateImageFiles([file]);
    if (error) {
      this.imageInvalid.emit({ message: error.message });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.heroSelected.emit({ file, preview: reader.result as string });
    reader.readAsDataURL(file);
  }

  async onGalerieSelect(event: Event): Promise<void> {
    const files = Array.from((event.target as HTMLInputElement).files ?? []) as File[];
    if (files.length < 3 || files.length > 10) {
      this.galerieInvalid.emit({ count: files.length });
      return;
    }

    const error = await validateImageFiles(files);
    if (error) {
      this.imageInvalid.emit({ message: error.message });
      return;
    }

    const previews: string[] = [];
    let loaded = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        previews.push(reader.result as string);
        if (++loaded === files.length) {
          this.galerieSelected.emit({ files, previews });
        }
      };
      reader.readAsDataURL(file);
    });
  }
}
