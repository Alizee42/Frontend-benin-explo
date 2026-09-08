import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyPreferenceService } from '../../services/currency-preference.service';

/**
 * Formate un montant stocke en EUR selon la devise d'affichage choisie par le
 * visiteur (CurrencyPreferenceService). Impur : se reevalue quand le signal
 * de devise change, meme si le montant source n'a pas bouge.
 *
 * Usage : {{ circuit.prixIndicatif | price }} -> "53,00 €" ou "34 771 F CFA"
 */
@Pipe({ name: 'price', standalone: true, pure: false })
export class PricePipe implements PipeTransform {
  private readonly currencyPreference = inject(CurrencyPreferenceService);

  transform(amountEur: number | null | undefined): string {
    if (amountEur == null) {
      return '';
    }

    const converted = this.currencyPreference.convert(amountEur);
    const currency = this.currencyPreference.currency();

    if (currency === 'XOF') {
      return `${Math.round(converted).toLocaleString('fr-FR')} F CFA`;
    }
    return `${converted.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }
}
