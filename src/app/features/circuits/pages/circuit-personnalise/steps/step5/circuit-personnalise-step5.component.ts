import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactInfo } from '../../circuit-personnalise.types';
import { isValidEmail } from '../../circuit-personnalise.utils';

@Component({
  standalone: true,
  selector: 'app-circuit-step5',
  imports: [CommonModule, FormsModule],
  templateUrl: './circuit-personnalise-step5.component.html',
  styleUrl: '../../circuit-personnalise-steps.scss'
})
export class CircuitPersonnaliseStep5Component {
  @Input() contact: ContactInfo = { nom: '', prenom: '', email: '', telephone: '', message: '' };
  @Input() isSubmitting = false;
  @Input() submitSuccess = false;
  @Input() submitError = false;
  @Input() submitErrorMessage = '';

  @Output() contactChange = new EventEmitter<ContactInfo>();
  @Output() prev = new EventEmitter<void>();
  @Output() formSubmit = new EventEmitter<void>();
  @Output() goHome = new EventEmitter<void>();

  stepError = '';

  validate(): boolean {
    this.stepError = '';
    const c = this.contact;
    if (!c.nom.trim() || !c.prenom.trim() || !c.telephone.trim()) {
      this.stepError = 'Veuillez remplir tous les champs obligatoires.';
      return false;
    }
    if (!c.email.trim() || !isValidEmail(c.email.trim())) {
      this.stepError = 'Veuillez saisir une adresse email valide.';
      return false;
    }
    return true;
  }

  onFieldChange(): void {
    this.stepError = '';
    this.contactChange.emit({ ...this.contact });
  }

  onSubmit(): void {
    if (!this.validate()) return;
    this.formSubmit.emit();
  }
}
