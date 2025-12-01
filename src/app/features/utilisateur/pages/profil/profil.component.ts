import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profil-page">
      <h1>Mon Profil</h1>
      <p>Page de profil utilisateur.</p>
    </div>
  `,
  styles: [`
    .profil-page {
      padding: 2rem;
    }
  `]
})
export class ProfilComponent {

}