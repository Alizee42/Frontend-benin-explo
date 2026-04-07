import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="parametres-page">
      <div class="settings-card">
        <span class="settings-label">Preferences du compte</span>
        <h1>Parametres</h1>
        <p class="settings-text">
          Les reglages avances du compte arrivent bientot. Pour l'instant, votre compte actif est bien
          reconnu et lie a vos reservations.
        </p>

        <div class="settings-info">
          <div class="settings-info__item">
            <span>Email actif</span>
            <strong>{{ authService.getUser()?.email || '-' }}</strong>
          </div>
          <div class="settings-info__item">
            <span>Securite</span>
            <strong>Pour changer le mot de passe, contactez l'agence.</strong>
          </div>
        </div>

        <div class="settings-actions">
          <a routerLink="/dashboard" class="settings-btn settings-btn--primary">Mon espace</a>
          <a routerLink="/mes-reservations" class="settings-btn settings-btn--secondary">Mes reservations</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .parametres-page {
      min-height: 100vh;
      padding: 2rem 1rem;
      background: #f6f7fb;
    }

    .settings-card {
      max-width: 780px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      border: 1px solid rgba(15, 23, 42, 0.06);
    }

    .settings-label {
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
      font-size: clamp(1.7rem, 4vw, 2.3rem);
      color: #0f172a;
    }

    .settings-text {
      margin: 0.9rem 0 1.5rem;
      color: #64748b;
      line-height: 1.7;
    }

    .settings-info {
      display: grid;
      gap: 1rem;
    }

    .settings-info__item {
      padding: 1rem 1.1rem;
      border-radius: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      display: grid;
      gap: 0.35rem;
    }

    .settings-info__item span {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
    }

    .settings-info__item strong {
      color: #0f172a;
      overflow-wrap: anywhere;
    }

    .settings-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      margin-top: 1.5rem;
    }

    .settings-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 180px;
      padding: 0.85rem 1.2rem;
      border-radius: 999px;
      font-weight: 700;
      text-decoration: none;
    }

    .settings-btn--primary {
      background: var(--be-green);
      color: white;
    }

    .settings-btn--secondary {
      background: white;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }

    @media (max-width: 640px) {
      .settings-card {
        padding: 1.5rem;
      }

      .settings-actions {
        flex-direction: column;
      }

      .settings-btn {
        width: 100%;
      }
    }
  `]
})
export class ParametresComponent {
  constructor(public authService: AuthService) {}
}
