import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { CircuitDTO } from '../../../models/circuit.dto';

@Component({
  selector: 'app-add-circuit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './add-circuit-modal.component.html',
  styleUrls: ['./add-circuit-modal.component.scss']
})
export class AddCircuitModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CircuitDTO>();

  @ViewChild('modal') modal!: ModalComponent;

  circuit: CircuitDTO = {
    id: 0,
    nom: '',
    description: '',
    dureeIndicative: '',
    prixIndicatif: 0,
    formuleProposee: '',
    niveau: '',
    zoneId: 0,
    activiteIds: []
  };

  open() {
    if (this.modal) {
      this.modal.open();
    }
  }

  closeModal() {
    this.close.emit();
  }

  onSubmit() {
    if (this.isValid()) {
      this.save.emit({ ...this.circuit });
      this.closeModal();
    }
  }

  private isValid(): boolean {
    const duree = parseInt(this.circuit.dureeIndicative);
    return !!(this.circuit.nom && this.circuit.description &&
              !isNaN(duree) && duree > 0 && this.circuit.prixIndicatif > 0);
  }

  private resetForm() {
    this.circuit = {
      id: 0,
      nom: '',
      description: '',
      dureeIndicative: '',
      prixIndicatif: 0,
      formuleProposee: '',
      niveau: '',
      zoneId: 0,
      activiteIds: []
    };
  }
}