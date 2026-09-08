import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'be-button',
  standalone: true,
  imports: [CommonModule],
  host: {
    'class': 'be-button-host',
    '[class.be-button-host-full]': 'fullWidth'
  },
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
      @if (iconLeft && !loading) {
        <i [class]="iconLeft" aria-hidden="true"></i>
      }
      @if (loading) {
        <span class="be-btn-spinner" aria-hidden="true"></span>
      }
      @if (label) {
        <span>{{ label }}</span>
      }
      @if (!label) {
        <ng-content></ng-content>
      }
      @if (iconRight && !loading) {
        <i [class]="iconRight" aria-hidden="true"></i>
      }
    </button>
    `,
  changeDetection: ChangeDetectionStrategy.Eager,
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
