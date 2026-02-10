import { Routes } from '@angular/router';import { authGuard } from './guards/auth.guard';
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

  /* HEBERGEMENTS */
  {
    path: 'hebergements',
    loadComponent: () =>
      import('./features/hebergements/pages/hebergements-list/hebergements-list.component').then(m => m.HebergementsListComponent),
    data: { headerLight: true }
  },

  /* RESERVATION HEBERGEMENT */
  {
    path: 'reservation-hebergement/:id',
    loadComponent: () =>
      import('./features/utilisateur/pages/reservation-hebergement/reservation-hebergement.component').then(m => m.ReservationHebergementComponent),
    data: { headerLight: true }
  },

  /* RESERVATION HEBERGEMENT */
  {
    path: 'reservation-hebergement/:id',
    loadComponent: () =>
      import('./features/utilisateur/pages/reservation-hebergement/reservation-hebergement.component').then(m => m.ReservationHebergementComponent),
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
      import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },

  /* ADMIN CIRCUITS MANAGEMENT */
  {
    path: 'admin/circuits',
    loadComponent: () =>
      import('./features/admin/circuit/circuits-admin.component').then(m => m.CircuitsAdminComponent),
    canActivate: [authGuard]
  },

  /* ADMIN ZONES */
  {
    path: 'admin/zones',
    loadComponent: () =>
      import('./features/admin/zones/zones.component').then(m => m.ZonesComponent),
    canActivate: [authGuard]
  },

  /* ADMIN ACTIVITES */
  {
    path: 'admin/activites',
    loadComponent: () =>
      import('./features/admin/activites/activites-admin.component').then(m => m.ActivitesAdminComponent),
    canActivate: [authGuard]
  },

  /* ADMIN VILLES */
  {
    path: 'admin/villes',
    loadComponent: () =>
      import('./features/admin/villes/villes.component').then(m => m.VillesComponent),
    canActivate: [authGuard]
  },

  /* ADMIN HEBERGEMENTS */
  {
    path: 'admin/hebergements',
    loadComponent: () =>
      import('./features/admin/hebergements/hebergements-admin.component').then(m => m.HebergementsAdminComponent),
    canActivate: [authGuard]
  },

  /* ADMIN RESERVATIONS HEBERGEMENTS */
  {
    path: 'admin/reservations-hebergement',
    loadComponent: () =>
      import('./features/admin/reservations-hebergement/reservations-hebergement-admin.component').then(m => m.ReservationsHebergementAdminComponent),
    canActivate: [authGuard]
  },

  /* ADMIN ADD CIRCUIT */
  {
    path: 'admin/circuits/add-circuit',
    loadComponent: () =>
      import('./features/admin/circuit/add-circuit-v2/add-circuit-v2.component').then(m => m.AddCircuitV2Component),
    canActivate: [authGuard]
  },

  /* ADMIN EDIT CIRCUIT */
  {
    path: 'admin/circuits/edit-circuit/:id',
    loadComponent: () =>
      import('./features/admin/circuit/edit-circuit/edit-circuit.component').then(m => m.EditCircuitComponent),
    canActivate: [authGuard]
  },

  /* ADMIN DETAIL CIRCUIT */
  {
    path: 'admin/circuits/detail/:id',
    loadComponent: () =>
      import('./features/admin/circuit/circuit-details/circuit-details.component').then(m => m.CircuitDetailsComponent),
    canActivate: [authGuard]
  },

  /* ADMIN CIRCUITS PERSONNALISES */
  {
    path: 'admin/circuits-personnalises',
    loadComponent: () =>
      import('./features/admin/circuits-personnalises/circuits-personnalises-admin.component').then(m => m.CircuitsPersonnalisesAdminComponent),
    canActivate: [authGuard]
  },

  /* ADMIN DETAIL CIRCUIT PERSONNALISE */
  {
    path: 'admin/circuits-personnalises/detail/:id',
    loadComponent: () =>
      import('./features/admin/circuits-personnalises/detail/circuit-personnalise-detail.component').then(m => m.CircuitPersonnaliseDetailComponent),
    canActivate: [authGuard]
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
