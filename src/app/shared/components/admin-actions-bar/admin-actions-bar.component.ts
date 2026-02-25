import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-actions-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-actions-bar.component.html',
  styleUrls: ['./admin-actions-bar.component.scss']
})
export class AdminActionsBarComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() subtitle = '';
}

