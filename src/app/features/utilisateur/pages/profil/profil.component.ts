import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../../../services/auth.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss']
})
export class ProfilComponent implements OnInit {
  user: User | null = null;

  editMode = false;
  saving = false;
  successMessage = '';
  errorMessage = '';

  editNom = '';
  editPrenom = '';
  editTelephone = '';

  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
  }

  get fullName(): string {
    return [this.user?.prenom, this.user?.nom].filter(Boolean).join(' ') || 'Mon profil';
  }

  get initials(): string {
    const p = this.user?.prenom?.trim() || '';
    const n = this.user?.nom?.trim() || '';
    return ((p[0] || '') + (n[0] || '')).toUpperCase() || '?';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get roleLabel(): string {
    return this.isAdmin ? 'Administrateur' : 'Client';
  }

  get roleClass(): string {
    return this.isAdmin ? 'role-admin' : 'role-user';
  }

  get quickLinks(): { icon: string; label: string; sub: string; route: string }[] {
    if (this.isAdmin) {
      return [
        { icon: 'ri-dashboard-line', label: 'Tableau de bord', sub: 'Vue d\'ensemble de l\'activite', route: '/admin/dashboard' },
        { icon: 'ri-calendar-todo-line', label: 'Reservations hebergement', sub: 'Gerer et suivre les sejours', route: '/admin/reservations-hebergement' },
        { icon: 'ri-hotel-bed-line', label: 'Hebergements', sub: 'Gerer le catalogue logements', route: '/admin/hebergements' },
        { icon: 'ri-route-line', label: 'Circuits', sub: 'Gerer les circuits et activites', route: '/admin/circuits' }
      ];
    }
    return [
      { icon: 'ri-calendar-check-line', label: 'Mes reservations', sub: 'Consulter mes sejours reserves', route: '/mes-reservations' },
      { icon: 'ri-hotel-bed-line', label: 'Hebergements', sub: 'Parcourir les logements disponibles', route: '/hebergements' },
      { icon: 'ri-route-line', label: 'Decouvrir les circuits', sub: 'Explorer les itineraires au Benin', route: '/circuit' },
      { icon: 'ri-instance-line', label: 'Circuit personnalise', sub: 'Creer votre voyage sur mesure', route: '/circuit-personnalise' }
    ];
  }

  startEdit(): void {
    this.editNom = this.user?.nom || '';
    this.editPrenom = this.user?.prenom || '';
    this.editTelephone = this.user?.telephone || '';
    this.editMode = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.editMode = false;
    this.errorMessage = '';
  }

  saveProfile(): void {
    if (!this.editNom.trim() || !this.editPrenom.trim()) {
      this.errorMessage = 'Nom et prénom sont obligatoires.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.http.patch<User>('/auth/me', {
      nom: this.editNom.trim(),
      prenom: this.editPrenom.trim(),
      telephone: this.editTelephone.trim()
    }).subscribe({
      next: (updated) => {
        const current = this.authService.getUser();
        if (current) {
          current.nom = updated.nom;
          current.prenom = updated.prenom;
          current.telephone = updated.telephone;
          localStorage.setItem('user_data', JSON.stringify(current));
        }
        this.user = this.authService.getUser();
        this.saving = false;
        this.editMode = false;
        this.successMessage = 'Profil mis a jour avec succes.';
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: () => {
        this.errorMessage = 'Impossible de sauvegarder les modifications.';
        this.saving = false;
      }
    });
  }
}
