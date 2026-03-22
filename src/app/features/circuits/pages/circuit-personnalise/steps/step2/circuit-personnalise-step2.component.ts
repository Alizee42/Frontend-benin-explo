import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Jour, isJourComplete } from '../../circuit-personnalise.types';
import { Zone } from '../../../../../../services/zones.service';
import { VilleDTO } from '../../../../../../services/villes.service';
import { Activite } from '../../../../../../services/activites.service';
import { TarifsCircuitPersonnaliseDTO } from '../../../../../../services/tarifs-circuit-personnalise.service';
import { getPricingCurrencyLabel } from '../../circuit-personnalise.utils';

@Component({
  standalone: true,
  selector: 'app-circuit-step2',
  imports: [CommonModule, FormsModule],
  templateUrl: './circuit-personnalise-step2.component.html',
  styleUrl: '../../circuit-personnalise-steps.scss'
})
export class CircuitPersonnaliseStep2Component implements OnChanges {
  @Input() jours: Jour[] = [];
  @Input() zones: Zone[] = [];
  @Input() villes: VilleDTO[] = [];
  @Input() activites: Activite[] = [];
  @Input() catalogLoading = false;
  @Input() tarifsOptions: TarifsCircuitPersonnaliseDTO | null = null;

  @Output() joursChange = new EventEmitter<Jour[]>();
  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  activeJourIndex = 0;
  stepError = '';

  private readonly PAGE_SIZE = 6;
  private readonly MAX_ACTIVITES = 5;
  private readonly MAX_MINUTES_PER_DAY = 12 * 60;
  private activitesPageByJour: Record<number, number> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jours'] && this.activeJourIndex >= this.jours.length && this.jours.length > 0) {
      this.activeJourIndex = 0;
    }
  }

  /** Called by parent via @ViewChild before navigating forward. */
  validate(): boolean {
    this.stepError = '';
    const idx = this.jours.findIndex(j => !isJourComplete(j));
    if (idx === -1) return true;

    this.activeJourIndex = idx;
    this.ensurePageInRange(idx);

    const jour = this.jours[idx];
    const missing: string[] = [];
    if (!jour.zoneId) missing.push('la zone');
    if (!jour.villeId) missing.push('la ville');
    if (jour.activites.length === 0) missing.push('au moins une activité');

    this.stepError = `Complète le jour ${jour.numero} avant de continuer : ${missing.join(', ')}.`;
    return false;
  }

  selectJour(index: number): void {
    this.activeJourIndex = index;
    this.stepError = '';
    this.ensurePageInRange(index);
  }

  onZoneChange(jour: Jour, zoneId: number | null): void {
    jour.zoneId = zoneId;
    jour.villeId = null;
    jour.activites = [];
    this.resetPage(this.activeJourIndex);
    this.stepError = '';
    this.emitJours();
  }

  onVilleChange(jour: Jour, villeId: number | null): void {
    jour.villeId = villeId;
    jour.activites = [];
    this.resetPage(this.activeJourIndex);
    this.stepError = '';
    this.emitJours();
  }

  toggleActivite(jourIndex: number, activite: Activite): void {
    const jour = this.jours[jourIndex];
    const idx = jour.activites.indexOf(activite.id);
    if (idx > -1) {
      jour.activites = jour.activites.filter(id => id !== activite.id);
      this.emitJours();
      return;
    }
    if (jour.activites.length >= this.MAX_ACTIVITES) {
      this.stepError = `Maximum ${this.MAX_ACTIVITES} activités par jour.`;
      return;
    }
    const used = jour.activites.reduce((sum, id) => {
      const a = this.activites.find(x => x.id === id);
      return sum + this.getMinutes(a);
    }, 0);
    if (used + this.getMinutes(activite) > this.MAX_MINUTES_PER_DAY) {
      this.stepError = `Durée maximale dépassée (${this.MAX_MINUTES_PER_DAY / 60}h par jour).`;
      return;
    }
    jour.activites = [...jour.activites, activite.id];
    this.stepError = '';
    this.emitJours();
  }

  isSelected(jourIndex: number, activite: Activite): boolean {
    return this.jours[jourIndex]?.activites.includes(activite.id) ?? false;
  }

  getActivitesDisponibles(jourIndex: number): Activite[] {
    const jour = this.jours[jourIndex];
    if (!jour) return [];
    return this.activites.filter(a =>
      (!jour.zoneId || a.zoneId === jour.zoneId) &&
      (!jour.villeId || a.villeId === jour.villeId)
    );
  }

  getPaginatedActivites(jourIndex: number): Activite[] {
    const page = this.getCurrentPage(jourIndex);
    return this.getActivitesDisponibles(jourIndex)
      .slice((page - 1) * this.PAGE_SIZE, page * this.PAGE_SIZE);
  }

  getTotalPages(jourIndex: number): number {
    return Math.max(1, Math.ceil(this.getActivitesDisponibles(jourIndex).length / this.PAGE_SIZE));
  }

  getCurrentPage(jourIndex: number): number {
    const key = this.jours[jourIndex]?.numero ?? jourIndex;
    const total = this.getTotalPages(jourIndex);
    const page = Math.min(Math.max(this.activitesPageByJour[key] ?? 1, 1), total);
    this.activitesPageByJour[key] = page;
    return page;
  }

  changePage(jourIndex: number, page: number): void {
    const key = this.jours[jourIndex]?.numero ?? jourIndex;
    this.activitesPageByJour[key] = Math.min(Math.max(page, 1), this.getTotalPages(jourIndex));
  }

  getPageNumbers(jourIndex: number): number[] {
    return Array.from({ length: this.getTotalPages(jourIndex) }, (_, i) => i + 1);
  }

  getRangeLabel(jourIndex: number): string {
    const total = this.getActivitesDisponibles(jourIndex).length;
    if (total === 0) return '0 activité';
    const page = this.getCurrentPage(jourIndex);
    const start = (page - 1) * this.PAGE_SIZE + 1;
    const end = Math.min(start + this.PAGE_SIZE - 1, total);
    return `${start}-${end} sur ${total} activité${total > 1 ? 's' : ''}`;
  }

  getVillesForZone(zoneId: number | null): VilleDTO[] {
    if (!zoneId) return [];
    return this.villes.filter(v => v.zoneId === zoneId);
  }

  getZoneName(jour: Jour): string {
    return this.zones.find(z => z.idZone === jour.zoneId)?.nom ?? '';
  }

  getActiviteNames(jour: Jour): string {
    return jour.activites
      .map(id => this.activites.find(a => a.id === id)?.nom)
      .filter((n): n is string => !!n)
      .join(', ');
  }

  getActiviteById(id: number): Activite | undefined {
    return this.activites.find(a => a.id === id);
  }

  isComplete(jour: Jour): boolean { return isJourComplete(jour); }
  getStatus(jour: Jour): string { return isJourComplete(jour) ? 'Complet' : 'Manquant'; }
  isPlanningComplete(): boolean { return this.jours.every(j => isJourComplete(j)); }
  getPricingLabel(): string { return getPricingCurrencyLabel(this.tarifsOptions); }

  formatPrixBadge(prix: number): string {
    const r = Math.max(0, Math.round(prix));
    return r > 999 ? '999+' : String(r);
  }

  trackByJour(_: number, j: Jour): number { return j.numero; }
  trackByZone(_: number, z: Zone): number { return z.idZone; }
  trackByVille(_: number, v: VilleDTO): number { return v.id; }
  trackByActivite(_: number, a: Activite): number { return a.id; }

  private getMinutes(activite: Activite | undefined): number {
    if (!activite) return 0;
    if (activite.dureeMinutes != null) return Number(activite.dureeMinutes);
    if (activite.duree != null) return Math.round(Number(activite.duree) * 60);
    return 0;
  }

  private emitJours(): void {
    this.joursChange.emit(this.jours.map(j => ({ ...j, activites: [...j.activites] })));
  }

  private resetPage(jourIndex: number): void {
    const key = this.jours[jourIndex]?.numero ?? jourIndex;
    this.activitesPageByJour[key] = 1;
  }

  private ensurePageInRange(jourIndex: number): void {
    this.getCurrentPage(jourIndex);
  }
}
