import { TarifsCircuitPersonnaliseDTO } from '../../../../services/tarifs-circuit-personnalise.service';
import { OptionsGenerales, Jour, TRANSPORT_OPTIONS } from './circuit-personnalise.types';
import { HebergementDTO } from '../../../../services/hebergements.service';

export function getTarifValue(value: number | undefined | null): number {
  if (value == null || Number.isNaN(Number(value))) return 0;
  return Math.max(Number(value), 0);
}

export function getTransportDailyRate(
  tarifsOptions: TarifsCircuitPersonnaliseDTO | null,
  transportId: string
): number {
  if (!tarifsOptions) return 0;
  switch (transportId) {
    case 'compact':  return getTarifValue(tarifsOptions.transportCompactParJour);
    case 'familial': return getTarifValue(tarifsOptions.transportFamilialParJour);
    case 'minibus':  return getTarifValue(tarifsOptions.transportMinibusParJour);
    case 'bus':      return getTarifValue(tarifsOptions.transportBusParJour);
    default:         return 0;
  }
}

export function getPricingCurrencyLabel(tarifsOptions: TarifsCircuitPersonnaliseDTO | null): string {
  return (tarifsOptions?.devise || 'EUR').toUpperCase();
}

export function getTransportLabel(transportId: string): string {
  return TRANSPORT_OPTIONS.find(t => t.id === transportId)?.label ?? '';
}

export function calculerPrixActivites(
  jours: Jour[],
  activites: Array<{ id: number; prix: number | null }>
): number {
  return jours.reduce((total, jour) =>
    total + jour.activites.reduce((sum, id) => {
      const act = activites.find(a => a.id === id);
      return sum + (act?.prix ?? 0);
    }, 0), 0);
}

export function calculerPrixHebergement(
  hebergement: HebergementDTO | undefined,
  dateArrivee: string,
  dateDepart: string
): number {
  if (!hebergement) return 0;
  const nuits = getNombreNuits(dateArrivee, dateDepart);
  return nuits > 0 ? hebergement.prixParNuit * nuits : 0;
}

export function calculerPrixTransport(
  tarifsOptions: TarifsCircuitPersonnaliseDTO | null,
  transportId: string,
  nombreJours: number
): number {
  if (!transportId) return 0;
  return getTransportDailyRate(tarifsOptions, transportId) * Math.max(nombreJours, 0);
}

export function calculerPrixGuide(
  tarifsOptions: TarifsCircuitPersonnaliseDTO | null,
  options: OptionsGenerales,
  nombreJours: number
): number {
  if (!options.guide) return 0;
  return getTarifValue(tarifsOptions?.guideParJour) * Math.max(nombreJours, 0);
}

export function calculerPrixChauffeur(
  tarifsOptions: TarifsCircuitPersonnaliseDTO | null,
  options: OptionsGenerales,
  nombreJours: number
): number {
  if (!options.chauffeur) return 0;
  return getTarifValue(tarifsOptions?.chauffeurParJour) * Math.max(nombreJours, 0);
}

export function calculerPrixPensionComplete(
  tarifsOptions: TarifsCircuitPersonnaliseDTO | null,
  options: OptionsGenerales,
  nombreJours: number,
  nombrePersonnes: number
): number {
  if (!options.pensionComplete) return 0;
  return getTarifValue(tarifsOptions?.pensionCompleteParPersonneParJour)
    * Math.max(nombreJours, 0)
    * Math.max(nombrePersonnes, 0);
}

export function calculerPrixTotal(
  jours: Jour[],
  activites: Array<{ id: number; prix: number | null }>,
  hebergement: HebergementDTO | undefined,
  dateArrivee: string,
  dateDepart: string,
  tarifsOptions: TarifsCircuitPersonnaliseDTO | null,
  options: OptionsGenerales,
  nombreJours: number,
  nombrePersonnes: number
): number {
  return calculerPrixActivites(jours, activites)
    + calculerPrixHebergement(hebergement, dateArrivee, dateDepart)
    + calculerPrixTransport(tarifsOptions, options.transportId, nombreJours)
    + calculerPrixGuide(tarifsOptions, options, nombreJours)
    + calculerPrixChauffeur(tarifsOptions, options, nombreJours)
    + calculerPrixPensionComplete(tarifsOptions, options, nombreJours, nombrePersonnes);
}

export function getNombreNuits(dateArrivee: string, dateDepart: string): number {
  if (!dateArrivee || !dateDepart) return 0;
  const arrivee = parseDate(dateArrivee);
  const depart = parseDate(dateDepart);
  if (!arrivee || !depart) return 0;
  const diff = depart.getTime() - arrivee.getTime();
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}

export function parseDate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const d = new Date(year, month - 1, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLabel(value: string): string {
  const d = parseDate(value);
  if (!d) return value;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
