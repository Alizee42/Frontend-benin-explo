import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CircuitFormData, PointFort } from '../circuit-form.types';

@Component({
  selector: 'app-add-circuit-step4',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-circuit-step4.component.html'
})
export class AddCircuitStep4Component {
  @Input() circuit!: CircuitFormData;
  @Input() errors: { [key: string]: string } = {};
  @Input() predefinedPointsForts: PointFort[] = [];

  step4Section: 'highlights' | 'inclusions' = 'highlights';

  setStep4Section(section: 'highlights' | 'inclusions'): void { this.step4Section = section; }

  addPointFort(): void {
    if (this.circuit.pointsForts.length < 5) this.circuit.pointsForts.push({ icon: '🏛️', title: '', desc: '' });
  }
  removePointFort(index: number): void {
    if (this.circuit.pointsForts.length > 1) this.circuit.pointsForts.splice(index, 1);
  }
  addPredefinedPointFort(point: PointFort): void {
    if (this.circuit.pointsForts.length < 5) this.circuit.pointsForts.unshift({ ...point });
  }
  addInclus(): void { this.circuit.inclus.push(''); }
  removeInclus(index: number): void { if (this.circuit.inclus.length > 1) this.circuit.inclus.splice(index, 1); }
  addNonInclus(): void { this.circuit.nonInclus.push(''); }
  removeNonInclus(index: number): void { if (this.circuit.nonInclus.length > 1) this.circuit.nonInclus.splice(index, 1); }
  getStep4MissingSummary(): string[] {
    const s: string[] = [];
    if (!this.circuit.inclus.some(i => i.trim())) s.push('Inclus : au moins un élément');
    if (!this.circuit.nonInclus.some(i => i.trim())) s.push('Non inclus : au moins un élément');
    return s;
  }
  trackByIndex(index: number): number { return index; }
}
