import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-modal',
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  @Input() title = '';
  @Input() open = false;
  @Input() size: 'small' | 'medium' | 'large' | 'xlarge' = 'medium';
  @Input() showCloseButton = true;
  @Input() showFooter = true;
  @Input() closeOnBackdrop = true;

  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.open) this.closeModal();
  }

  closeModal() {
    this.open = false;
    this.close.emit();
  }

  onBackdropClick(event: Event): void {
    // Backdrop was clicked. We receive the native event but don't use it.
    // The click on the backdrop should close the modal when allowed.
    if (this.closeOnBackdrop) this.closeModal();
  }

  onContentClick(event: Event) {
    event.stopPropagation();
  }
}