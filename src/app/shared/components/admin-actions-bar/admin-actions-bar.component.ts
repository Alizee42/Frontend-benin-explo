import { Component, Input, ChangeDetectionStrategy } from '@angular/core';


@Component({
  selector: 'app-admin-actions-bar',
  standalone: true,
  imports: [],
  templateUrl: './admin-actions-bar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./admin-actions-bar.component.scss']
})
export class AdminActionsBarComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() subtitle = '';
}

