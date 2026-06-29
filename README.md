# Bénin Explo — Frontend

Application web Angular pour la plateforme de tourisme **Bénin Explo**, dédiée à la découverte du Bénin (Afrique de l'Ouest). Permet aux visiteurs de parcourir et réserver des circuits et hébergements, avec paiement PayPal intégré. Un back-office complet permet aux administrateurs de gérer l'ensemble du contenu.

## Stack technique

| Technologie | Version |
|---|---|
| Angular | 19.2 (standalone components) |
| TypeScript | 5.7 |
| Bootstrap | 5.3.8 |
| Remixicon | 4.7 |
| RxJS | 7.8 |
| Angular CLI | 19.2.19 |

## Prérequis

- Node.js 20+
- npm 10+
- Angular CLI 19 (`npm install -g @angular/cli`)
- Backend `benin-explo-backend` démarré sur `localhost:8080`

## Installation et lancement

```bash
git clone <url-du-repo>
cd Frontend-benin-explo
npm install

# Vérifier l'URL de l'API dans src/environments/environment.ts
# apiUrl: 'http://localhost:8080'

ng serve
# Application disponible sur http://localhost:4200
```

## Pages et fonctionnalités

### Pages publiques

| Route | Description |
|---|---|
| `/` | Accueil |
| `/circuit` | Liste des circuits |
| `/circuit/:id` | Détail d'un circuit |
| `/circuit-personnalise` | Formulaire de circuit sur mesure (5 étapes) |
| `/hebergements` | Liste des hébergements |
| `/actualites` | Actualités |
| `/contact` | Formulaire de contact |
| `/login` | Connexion |
| `/register` | Inscription |

### Espace utilisateur (connecté)

| Route | Description |
|---|---|
| `/dashboard` | Tableau de bord |
| `/mes-reservations` | Historique des réservations |
| `/reservation-hebergement/:id` | Réserver un hébergement |
| `/paiement/circuit/:id` | Payer un circuit (PayPal) |
| `/paiement/hebergement/:id` | Payer un hébergement (PayPal) |
| `/paiement/circuit-personnalise/:id` | Payer un circuit personnalisé (PayPal) |
| `/profil` | Profil et paramètres |

### Espace admin (`/admin/*`)

Accessible uniquement avec le rôle `ADMIN`.

- Dashboard avec KPIs
- Gestion : circuits, hébergements, actualités
- Gestion : réservations (circuits, hébergements, circuits personnalisés)
- Gestion : zones géographiques, villes, activités, catégories d'activités
- Tarifs des circuits personnalisés
- Paramètres du site

## Architecture

```
src/
├── app/
│   ├── features/
│   │   ├── admin/          # Interface d'administration
│   │   ├── actualites/     # Actualités
│   │   ├── auth/           # Authentification
│   │   ├── circuits/       # Circuits touristiques
│   │   ├── contact/        # Formulaire de contact
│   │   ├── hebergements/   # Hébergements
│   │   ├── home/           # Page d'accueil
│   │   └── utilisateur/    # Espace utilisateur
│   ├── shared/
│   │   ├── components/     # Header, footer, modal, data-table
│   │   ├── guards/         # authGuard, adminGuard
│   │   └── services/       # Services HTTP partagés
│   └── app.routes.ts
└── environments/           # Configuration dev / prod
```

## Build et déploiement

```bash
ng build --configuration production
# Fichiers générés dans dist/
```

Déployable sur Netlify, Vercel ou tout serveur statique. Ajouter un fichier `public/_redirects` pour le routing Angular :

```
/*    /index.html   200
```

Docker disponible : build multi-étapes (Node 18 → Nginx Alpine).
