import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../../../services/auth.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="profil-page">
      <div class="profil-shell">
        <div class="profil-card">
          <span class="profil-label">Compte client</span>
          <h1>{{ fullName }}</h1>
          <p class="profil-subtitle">Retrouvez ici les informations principales de votre compte Benin Explo.</p>

          <div class="profil-grid">
            <div class="profil-item">
              <span class="profil-item__label">Email</span>
              <strong>{{ user?.email || '-' }}</strong>
            </div>
            <div class="profil-item">
              <span class="profil-item__label">Telephone</span>
              <strong>{{ user?.telephone || '-' }}</strong>
            </div>
            <div class="profil-item">
              <span class="profil-item__label">Nom</span>
              <strong>{{ user?.nom || '-' }}</strong>
            </div>
            <div class="profil-item">
              <span class="profil-item__label">Prenom</span>
              <strong>{{ user?.prenom || '-' }}</strong>
            </div>
          </div>

          <div class="profil-actions">
            <a routerLink="/dashboard" class="profil-btn profil-btn--primary">Mon espace</a>
            <a routerLink="/mes-reservations" class="profil-btn profil-btn--secondary">Mes reservations</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profil-page {
      min-height: 100vh;
      padding: 2rem 1rem;
      background: #f6f7fb;
    }

    .profil-shell {
      max-width: 880px;
      margin: 0 auto;
    }

    .profil-card {
      background: white;
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      border: 1px solid rgba(15, 23, 42, 0.06);
    }

    .profil-label {
      display: inline-block;
      margin-bottom: 0.75rem;
      color: var(--be-green);
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.8rem, 4vw, 2.6rem);
      color: #0f172a;
    }

    .profil-subtitle {
      margin: 0.75rem 0 1.75rem;
      color: #64748b;
      line-height: 1.6;
    }

    .profil-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .profil-item {
      padding: 1rem 1.1rem;
      border-radius: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      display: grid;
      gap: 0.35rem;
    }

    .profil-item__label {
      font-size: 0.76rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
    }

    .profil-item strong {
      color: #0f172a;
      overflow-wrap: anywhere;
    }

    .profil-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      margin-top: 1.75rem;
    }

    .profil-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 180px;
      padding: 0.85rem 1.2rem;
      border-radius: 999px;
      font-weight: 700;
      text-decoration: none;
    }

    .profil-btn--primary {
      background: var(--be-green);
      color: white;
    }

    .profil-btn--secondary {
      background: white;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }

    @media (max-width: 640px) {
      .profil-card {
        padding: 1.5rem;
      }

      .profil-actions {
        flex-direction: column;
      }

      .profil-btn {
        width: 100%;
      }
    }
  `]
})
export class ProfilComponent {
  user: User | null;

  constructor(private authService: AuthService) {
    this.user = this.authService.getUser();
  }

  get fullName(): string {
    const name = [this.user?.prenom, this.user?.nom]
      .map(value => value?.trim() || '')
      .filter(Boolean)
      .join(' ');

    return name || 'Mon profil';
  }
}
