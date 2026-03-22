import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircuitFormData } from '../circuit-form.types';

@Component({
  selector: 'app-add-circuit-step2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-circuit-step2.component.html'
})
export class AddCircuitStep2Component {
  @Input() circuit!: CircuitFormData;
  @Input() errors: { [key: string]: string } = {};
  @Input() previewHero: string | null = null;
  @Input() previewsGalerie: string[] = [];
  @Output() heroSelected = new EventEmitter<{ file: File; preview: string }>();
  @Output() galerieSelected = new EventEmitter<{ files: File[]; previews: string[] }>();

  onHeroSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.heroSelected.emit({ file, preview: reader.result as string });
    reader.readAsDataURL(file);
  }

  onGalerieSelect(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []) as File[];
    if (files.length < 3) { return; }
    if (files.length > 10) { return; }
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
