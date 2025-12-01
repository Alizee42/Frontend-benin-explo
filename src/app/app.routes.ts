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

  /* LOGIN */
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },

  /* ADMIN DASHBOARD */
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./features/admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  /* ADMIN CIRCUITS MANAGEMENT */
  {
    path: 'admin/circuits',
    loadComponent: () =>
      import('./features/admin/pages/circuits-admin/circuits-admin.component').then(m => m.CircuitsAdminComponent)
  },

  /* ADMIN ZONES MANAGEMENT */
  {
    path: 'admin/zones',
    loadComponent: () =>
      import('./features/admin/pages/zones-admin/zones-admin.component').then(m => m.ZonesAdminComponent)
  },

  /* ADMIN ACTIVITES MANAGEMENT */
  {
    path: 'admin/activites',
    loadComponent: () =>
      import('./features/admin/pages/activites-admin/activites-admin.component').then(m => m.ActivitesAdminComponent)
  },

  /* ADMIN CIRCUITS PERSONNALISES MANAGEMENT */
  {
    path: 'admin/circuits-personnalises',
    loadComponent: () =>
      import('./features/admin/pages/circuits-personnalises-admin/circuits-personnalises-admin.component').then(m => m.CircuitsPersonnalisesAdminComponent)
  },

  /* PROFIL */
  {
    path: 'profil',
    loadComponent: () =>
      import('./features/utilisateur/pages/profil/profil.component').then(m => m.ProfilComponent)
  },

  /* PARAMETRES */
  {
    path: 'parametres',
    loadComponent: () =>
      import('./features/utilisateur/pages/parametres/parametres.component').then(m => m.ParametresComponent)
  },

  /* WILDCARD → redirige vers l’accueil */
  {
    path: '**',
    redirectTo: ''
  }
];
