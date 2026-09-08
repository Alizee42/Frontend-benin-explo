import { Injectable, signal } from '@angular/core';
import { EUR_TO_XOF_RATE } from '../shared/constants/currency.constants';

export type Currency = 'EUR' | 'XOF';

const STORAGE_KEY = 'currency_preference';

/**
 * Toutes les prix en base sont stockes en EUR. Ce service ne fait que piloter
 * la devise d'AFFICHAGE choisie par le visiteur (EUR ou XOF/FCFA), memorisee
 * en local pour la session suivante. La conversion utilise le meme taux fixe
 * que le reste de l'app (EUR_TO_XOF_RATE).
 */
@Injectable({ providedIn: 'root' })
export class CurrencyPreferenceService {
  readonly currency = signal<Currency>(this.readStored());

  toggle(): void {
    this.set(this.currency() === 'EUR' ? 'XOF' : 'EUR');
  }

  set(currency: Currency): void {
    this.currency.set(currency);
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // localStorage indisponible (navigation privee, etc.) : on continue sans persister
    }
  }

  /** Convertit un montant EUR (tel que stocke en base) vers la devise d'affichage active. */
  convert(amountEur: number): number {
    return this.currency() === 'XOF' ? amountEur * EUR_TO_XOF_RATE : amountEur;
  }

  private readStored(): Currency {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'XOF' ? 'XOF' : 'EUR';
    } catch {
      return 'EUR';
    }
  }
}
