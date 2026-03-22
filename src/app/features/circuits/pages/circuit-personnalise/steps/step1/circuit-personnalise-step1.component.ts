import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-circuit-step1',
  imports: [CommonModule, FormsModule],
  templateUrl: './circuit-personnalise-step1.component.html',
  styleUrl: '../../circuit-personnalise-steps.scss'
})
export class CircuitPersonnaliseStep1Component {
  @Input() nombreJours = 1;
  @Input() nombrePersonnes = 1;
  @Input() catalogLoading = false;

  @Output() nombreJoursChange = new EventEmitter<number>();
  @Output() nombrePersonnesChange = new EventEmitter<number>();
  @Output() next = new EventEmitter<void>();

  readonly jourOptions = Array.from({ length: 14 }, (_, i) => i + 1);
  readonly personnesOptions = Array.from({ length: 10 }, (_, i) => i + 1);
}
