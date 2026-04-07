import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EUR_TO_XOF_RATE } from '../../../../../shared/constants/currency.constants';
import { CircuitFormData } from '../circuit-form.types';

@Component({
  selector: 'app-add-circuit-step1',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-circuit-step1.component.html'
})
export class AddCircuitStep1Component {
  @Input() circuit!: CircuitFormData;
  @Input() errors: { [key: string]: string } = {};
  @Output() dureeChanged = new EventEmitter<void>();

  readonly RATE = EUR_TO_XOF_RATE;
  priceCurrency: 'EUR' | 'XOF' = 'EUR';
  private lastPriceCurrency: 'EUR' | 'XOF' = 'EUR';

  onDureeChange(): void {
    this.dureeChanged.emit();
  }

  onPriceCurrencyChange(newCurrency: 'EUR' | 'XOF'): void {
    if (newCurrency === this.lastPriceCurrency) return;
    const current = Number(this.circuit.prixEuros);
    if (!isNaN(current) && current > 0) {
      this.circuit.prixEuros = newCurrency === 'XOF'
        ? Math.round(current * this.RATE)
        : Number((current / this.RATE).toFixed(2));
    }
    this.circuit.priceCurrency = newCurrency;
    this.lastPriceCurrency = newCurrency;
  }

  getPriceConversionLabel(): string {
    const value = Number(this.circuit.prixEuros);
    if (!value || isNaN(value)) return '';
    if (this.priceCurrency === 'EUR') return `≈ ${Math.round(value * this.RATE).toLocaleString()} XOF`;
    return `≈ ${Number((value / this.RATE).toFixed(2)).toLocaleString()} EUR`;
  }
}
