import { Injectable } from '@angular/core';
import { Jour, OptionsGenerales, HebergementState, ContactInfo } from './circuit-personnalise.types';

export interface CircuitPersonnaliseDraft {
  etape: number;
  nombreJours: number;
  nombrePersonnes: number;
  dateVoyageSouhaitee: string;
  jours: Jour[];
  options: OptionsGenerales;
  hebergementState: HebergementState;
  contact: ContactInfo;
  savedAt: number;
}

// Un brouillon plus vieux que ça n'est plus propose au restore (evite de faire remonter une
// demande obsolete/perimee si l'utilisateur revient des jours plus tard avec le meme onglet).
const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Sauvegarde la progression du formulaire circuit-personnalise en sessionStorage, pour ne pas
 * tout perdre sur un refresh/fermeture d'onglet accidentelle (bug trouve en audit UX : le
 * formulaire est long - jusqu'a 14 jours de planning - et n'avait aucune persistance).
 * sessionStorage plutot que localStorage : la progression s'efface a la fermeture de l'onglet,
 * evite de faire ressurgir une vieille demande perimee des semaines plus tard.
 */
@Injectable({
  providedIn: 'root'
})
export class CircuitPersonnaliseDraftService {
  private readonly storageKey = 'circuit-personnalise-draft';

  save(draft: Omit<CircuitPersonnaliseDraft, 'savedAt'>): void {
    try {
      const payload: CircuitPersonnaliseDraft = { ...draft, savedAt: Date.now() };
      sessionStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {
      // sessionStorage indisponible (navigation privee stricte, quota...) : on degrade
      // silencieusement, ce n'est qu'un confort, pas une fonctionnalite critique.
    }
  }

  load(): CircuitPersonnaliseDraft | null {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) return null;
      const draft = JSON.parse(raw) as CircuitPersonnaliseDraft;
      if (!draft?.savedAt || Date.now() - draft.savedAt > MAX_DRAFT_AGE_MS) {
        this.clear();
        return null;
      }
      return draft;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(this.storageKey);
    } catch {
      // idem : pas bloquant si sessionStorage est indisponible.
    }
  }
}
