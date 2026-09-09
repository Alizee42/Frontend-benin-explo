import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-circuit-step1',
  imports: [FormsModule],
  templateUrl: './circuit-personnalise-step1.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: '../../circuit-personnalise-steps.scss'
})
export class CircuitPersonnaliseStep1Component {
  @Input() nombreJours = 1;
  @Input() nombrePersonnes = 1;
  @Input() dateVoyageSouhaitee = '';
  @Input() catalogLoading = false;

  @Output() nombreJoursChange = new EventEmitter<number>();
  @Output() nombrePersonnesChange = new EventEmitter<number>();
  @Output() dateVoyageSouhaiteeChange = new EventEmitter<string>();
  @Output() next = new EventEmitter<void>();

  readonly jourOptions = Array.from({ length: 14 }, (_, i) => i + 1);
  readonly personnesOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  // Empêche de choisir une date de voyage dans le passé.
  readonly minDate = new Date().toISOString().slice(0, 10);
}
