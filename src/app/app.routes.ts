import { Routes } from '@angular/router';

export const routes: Routes = [

  /* PAGE D’ACCUEIL */
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent)
  },

  /* LISTE CIRCUITS */
  {
    path: 'circuit',
    loadComponent: () =>
      import('./features/circuits/pages/circuits-list/circuits-list.component').then(m => m.CircuitsListComponent),
    data: { headerLight: true }
  },

  /* DETAIL CIRCUIT */
  {
    path: 'circuit/:id',
    loadComponent: () =>
      import('./features/circuits/pages/circuit-detail/circuit-detail.component').then(m => m.CircuitDetailComponent),
    data: { headerLight: true }
  },

  /* CIRCUIT PERSONNALISÉ */
  {
    path: 'circuit-personnalise',
    loadComponent: () =>
      import('./features/circuits/pages/circuit-personnalise/circuit-personnalise.component').then(m => m.CircuitPersonnaliseComponent),
    data: { headerLight: true }
  },

  /* WILDCARD → redirige vers l’accueil */
  {
    path: '**',
    redirectTo: ''
  }
];
