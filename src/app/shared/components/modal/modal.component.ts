import { Component, EventEmitter, Input, Output, HostListener, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-modal',
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnChanges {
  @Input() title = '';
  @Input() open = false;
  @Input() size: 'small' | 'medium' | 'large' | 'xlarge' = 'medium';
  @Input() showCloseButton = true;
  @Input() showFooter = true;
  @Input() closeOnBackdrop = true;

  @Output() close = new EventEmitter<void>();

  private previouslyFocused: HTMLElement | null = null;

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        this.previouslyFocused = document.activeElement as HTMLElement;
        setTimeout(() => {
          const focusable = this.el.nativeElement.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement | null;
          focusable?.focus();
        });
      } else if (this.previouslyFocused) {
        this.previouslyFocused.focus();
        this.previouslyFocused = null;
      }
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.open) this.closeModal();
  }

  closeModal() {
    this.open = false;
    this.close.emit();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) this.closeModal();
  }

  onContentClick(event: Event) {
    event.stopPropagation();
  }
}
