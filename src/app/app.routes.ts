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
      import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  /* ADMIN CIRCUITS MANAGEMENT */
  {
    path: 'admin/circuits',
    loadComponent: () =>
      import('./features/admin/circuit/circuits-admin.component').then(m => m.CircuitsAdminComponent)
  },

  /* ADMIN ADD CIRCUIT */
  {
    path: 'admin/circuits/add-circuit',
    loadComponent: () =>
      import('./features/admin/circuit/add-circuit/add-circuit.component').then(m => m.AddCircuitComponent)
  },

  /* ADMIN EDIT CIRCUIT */
  {
    path: 'admin/circuits/edit-circuit/:id',
    loadComponent: () =>
      import('./features/admin/circuit/edit-circuit/edit-circuit.component').then(m => m.EditCircuitComponent)
  },

  /* ADMIN DETAIL CIRCUIT */
  {
    path: 'admin/circuits/detail/:id',
    loadComponent: () =>
      import('./features/admin/circuit/circuit-details/circuit-details.component').then(m => m.CircuitDetailsComponent)
  },

  /* ADMIN CIRCUITS PERSONNALISES */
  {
    path: 'admin/circuits-personnalises',
    loadComponent: () =>
      import('./features/admin/circuits-personnalises/circuits-personnalises-admin.component').then(m => m.CircuitsPersonnalisesAdminComponent)
  },

  /* ADMIN DETAIL CIRCUIT PERSONNALISE */
  {
    path: 'admin/circuits-personnalises/detail/:id',
    loadComponent: () =>
      import('./features/admin/circuits-personnalises/detail/circuit-personnalise-detail.component').then(m => m.CircuitPersonnaliseDetailComponent)
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
