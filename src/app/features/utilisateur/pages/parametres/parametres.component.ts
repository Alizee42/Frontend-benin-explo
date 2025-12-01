import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="parametres-page">
      <h1>Paramètres</h1>
      <p>Page de paramètres utilisateur.</p>
    </div>
  `,
  styles: [`
    .parametres-page {
      padding: 2rem;
    }
  `]
})
export class ParametresComponent {

}