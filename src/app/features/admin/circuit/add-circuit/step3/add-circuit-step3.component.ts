import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZoneDTO } from '../../../../../services/zones-admin.service';
import { VilleDTO } from '../../../../../services/villes.service';
import { Activite } from '../../../../../services/activites.service';
import { CircuitFormData } from '../circuit-form.types';

@Component({
  selector: 'app-add-circuit-step3',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-circuit-step3.component.html'
})
export class AddCircuitStep3Component {
  @Input() circuit!: CircuitFormData;
  @Input() zones: ZoneDTO[] = [];
  @Input() villesParJour: { [k: number]: VilleDTO[] } = {};
  @Input() activitesParJour: { [k: number]: Activite[] } = {};
  @Input() errors: { [key: string]: string } = {};
  @Input() programmeMissingDetails: Array<{ jour: number; missing: string[] }> = [];
  @Output() zoneChanged = new EventEmitter<number>();
  @Output() villeChanged = new EventEmitter<number>();

  activeDayIndex = 0;

  selectDay(index: number): void {
    if (index >= 0 && index < this.circuit.programme.length) {
      this.activeDayIndex = index;
    }
  }

  goPrevDay(): void { this.selectDay(this.activeDayIndex - 1); }
  goNextDay(): void { this.selectDay(this.activeDayIndex + 1); }

  onZoneChange(jourIndex: number): void { this.zoneChanged.emit(jourIndex); }
  onVilleChange(jourIndex: number): void { this.villeChanged.emit(jourIndex); }

  toggleActivite(jourIndex: number, activiteId: number): void {
    const jour = this.circuit.programme[jourIndex];
    const idx = jour.activiteIds.indexOf(activiteId);
    if (idx > -1) jour.activiteIds.splice(idx, 1);
    else jour.activiteIds.push(activiteId);
  }

  isActiviteSelected(jourIndex: number, activiteId: number): boolean {
    return this.circuit.programme[jourIndex].activiteIds.includes(activiteId);
  }

  getVillesForJour(jourIndex: number): VilleDTO[] {
    return this.villesParJour[jourIndex] || [];
  }

  getActivitesForJour(jourIndex: number): Activite[] {
    const jour = this.circuit.programme[jourIndex];
    let activites = this.activitesParJour[jourIndex] || [];
    if (jour.villeId) activites = activites.filter(act => act.villeId === jour.villeId);
    return activites;
  }

  getDayMissingFields(index: number): string[] {
    const jour = this.circuit.programme[index];
    if (!jour) return [];
    const missing: string[] = [];
    if (!jour.zoneId) missing.push('zone');
    if (!jour.villeId) missing.push('ville');
    if (!jour.description.trim()) missing.push('description');
    return missing;
  }

  getStep3MissingSummary(): string[] {
    return this.programmeMissingDetails.map(item => `Jour ${item.jour} : ${item.missing.join(', ')}`);
  }

  isLoadingVillesForJour(jourIndex: number): boolean {
    return this.circuit.programme[jourIndex]?.zoneId !== null && !this.villesParJour[jourIndex];
  }

  isLoadingActivitesForJour(jourIndex: number): boolean {
    return this.circuit.programme[jourIndex]?.zoneId !== null && !this.activitesParJour[jourIndex];
  }

  trackByIndex(index: number): number { return index; }
}
