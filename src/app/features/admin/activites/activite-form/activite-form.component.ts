import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Activite } from '../../../../services/activites.service';

@Component({
  standalone: true,
  selector: 'app-activite-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './activite-form.component.html',
  styleUrls: ['./activite-form.component.scss']
})
export class ActiviteFormComponent {
  @Input() activite: Partial<Activite> | null = null;
  @Input() zones: any[] = [];
  @Output() save = new EventEmitter<Partial<Activite>>();
  @Output() cancel = new EventEmitter<void>();

  onSave() {
    if (this.activite) this.save.emit(this.activite);
  }
}
