import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { HebergementsListComponent } from './features/hebergements/pages/hebergements-list/hebergements-list.component';
import { canDeactivateCircuitPersonnalise } from './features/circuits/pages/circuit-personnalise/circuit-personnalise.guard';
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
    canDeactivate: [canDeactivateCircuitPersonnalise],
    data: { headerLight: true }
  },

  /* HEBERGEMENTS */
  {
    path: 'hebergements',
    component: HebergementsListComponent,
    data: { headerLight: true }
  },

  /* MES RÉSERVATIONS */
  {
    path: 'mes-reservations',
    loadComponent: () =>
      import('./features/utilisateur/pages/mes-reservations/mes-reservations.component').then(m => m.MesReservationsComponent),
    canActivate: [authGuard],
    data: { headerLight: true }
  },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/utilisateur/pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },

  /* RESERVATION HEBERGEMENT */
  {
    path: 'reservation-hebergement/:id',
    loadComponent: () =>
      import('./features/utilisateur/pages/reservation-hebergement/reservation-hebergement.component').then(m => m.ReservationHebergementComponent),
    canActivate: [authGuard],
    data: { headerLight: true }
  },

  /* LOGIN */
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },

  /* REGISTER */
  {
    path: 'register',
    loadComponent: () =>
      import('./features/utilisateur/pages/register/register.component').then(m => m.RegisterComponent)
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

  /* ADMIN CATEGORIES ACTIVITES */
  {
    path: 'admin/categories-activites',
    loadComponent: () =>
      import('./features/admin/categories-activites/categories-activites-admin.component').then(m => m.CategoriesActivitesAdminComponent),
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

  /* ADMIN RESERVATIONS CIRCUITS */
  {
    path: 'admin/reservations-circuit',
    loadComponent: () =>
      import('./features/admin/reservations-circuit/reservations-circuit-admin.component').then(m => m.ReservationsCircuitAdminComponent),
    canActivate: [authGuard]
  },

  /* ADMIN ADD CIRCUIT */
  {
    path: 'admin/circuits/add-circuit',
    loadComponent: () =>
      import('./features/admin/circuit/add-circuit/add-circuit.component').then(m => m.AddCircuitComponent),
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

  /* ADMIN TARIFS CIRCUIT PERSONNALISE */
  {
    path: 'admin/tarifs-circuit-personnalise',
    loadComponent: () =>
      import('./features/admin/tarifs-circuit-personnalise/tarifs-circuit-personnalise-admin.component').then(m => m.TarifsCircuitPersonnaliseAdminComponent),
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
      import('./features/utilisateur/pages/profil/profil.component').then(m => m.ProfilComponent),
    canActivate: [authGuard]
  },

  /* PARAMETRES */
  {
    path: 'parametres',
    loadComponent: () =>
      import('./features/utilisateur/pages/parametres/parametres.component').then(m => m.ParametresComponent),
    canActivate: [authGuard]
  },

  /* WILDCARD → redirige vers l’accueil */
  {
    path: '**',
    redirectTo: ''
  }
];
