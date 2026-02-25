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
      [attr.aria-label]="ariaLabel || label || null"
      [attr.aria-busy]="loading"
      [ngClass]="[
        'be-btn',
        'be-btn-' + variant,
        'be-btn-' + size,
        fullWidth ? 'be-btn-full' : '',
        iconOnly ? 'be-btn-icon-only' : '',
        loading ? 'is-loading' : ''
      ]"
    >
      <i *ngIf="iconLeft && !loading" [class]="iconLeft" aria-hidden="true"></i>
      <span *ngIf="loading" class="be-btn-spinner" aria-hidden="true"></span>
      <span *ngIf="label">{{ label }}</span>
      <ng-content *ngIf="!label"></ng-content>
      <i *ngIf="iconRight && !loading" [class]="iconRight" aria-hidden="true"></i>
    </button>
  `,
  styleUrls: ['./be-button.component.scss']
})
export class BeButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() fullWidth = false;
  @Input() iconOnly = false;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() label = '';
  @Input() iconLeft = '';
  @Input() iconRight = '';
  @Input() ariaLabel = '';
}
