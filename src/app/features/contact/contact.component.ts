import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ParametresSiteDTO, ParametresSiteService } from '../../services/parametres-site.service';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {

  parametres: ParametresSiteDTO | null = null;
  loading = true;
  sending = false;

  form = {
    nom: '',
    email: '',
    sujet: '',
    message: ''
  };

  sent = false;
  formError = '';

  constructor(
    private parametresSiteService: ParametresSiteService,
    private contactService: ContactService
  ) {}

  ngOnInit(): void {
    this.parametresSiteService.getPrimary().subscribe({
      next: (p) => { this.parametres = p; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  submitForm(): void {
    if (!this.form.nom.trim() || !this.form.email.trim() || !this.form.message.trim()) {
      this.formError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    this.formError = '';
    this.sending = true;

    this.contactService.sendMessage({
      nom:     this.form.nom.trim(),
      email:   this.form.email.trim(),
      sujet:   this.form.sujet.trim(),
      message: this.form.message.trim()
    }).subscribe({
      next: () => {
        this.sent = true;
        this.sending = false;
      },
      error: () => {
        this.formError = 'Une erreur est survenue. Veuillez réessayer ou nous contacter directement par email.';
        this.sending = false;
      }
    });
  }

  resetForm(): void {
    this.form = { nom: '', email: '', sujet: '', message: '' };
    this.sent = false;
    this.formError = '';
  }
}
