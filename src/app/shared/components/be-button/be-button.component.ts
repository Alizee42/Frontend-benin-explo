import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'be-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [ngClass]="['be-btn', 'be-btn-' + variant, fullWidth ? 'be-btn-full' : '']"
    >
      <ng-content></ng-content>
    </button>
  `,
  styleUrls: ['./be-button.component.scss']
})
export class BeButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @Input() fullWidth = false;
  @Input() disabled = false;
}
