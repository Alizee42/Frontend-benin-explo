import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-admin-actions-bar',
  standalone: true,
  imports: [],
  templateUrl: './admin-actions-bar.component.html',
  styleUrls: ['./admin-actions-bar.component.scss']
})
export class AdminActionsBarComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() subtitle = '';
}

