# Bénin Explo — Frontend

Application web du projet **Bénin Explo**, une plateforme de tourisme dédiée au Bénin. Découverte de circuits, hébergements, réservation en ligne et paiement PayPal.

---

## Stack technique

| Technologie | Version |
|---|---|
| Angular | 19.2 |
| TypeScript | 5.7 |
| Bootstrap | 5.3 |
| Remixicon | 4.7 |

Architecture : **standalone components**, routes lazy-loadées, guards d'authentification.

---

## Prérequis

- Node.js 20+
- npm 10+
- Angular CLI 19 : `npm install -g @angular/cli`

---

## Installation locale

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd Frontend-benin-explo
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

Vérifier le fichier `src/environments/environment.ts` et s'assurer que l'URL de l'API pointe vers le backend local :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

### 4. Lancer le serveur de développement

```bash
ng serve
```

L'application est accessible sur `http://localhost:4200`.

> Le backend doit être démarré pour que les données s'affichent.

---

## Pages publiques

| Route | Description |
|---|---|
| `/` | Accueil |
| `/circuit` | Liste des circuits |
| `/circuit/:id` | Détail d'un circuit |
| `/circuit-personnalise` | Formulaire de circuit sur mesure |
| `/hebergements` | Liste des hébergements |
| `/actualites` | Actualités |
| `/contact` | Formulaire de contact |
| `/login` | Connexion |
| `/register` | Inscription |

## Espace utilisateur (connecté)

| Route | Description |
|---|---|
| `/dashboard` | Tableau de bord |
| `/mes-reservations` | Historique des réservations |
| `/reservation-hebergement/:id` | Réserver un hébergement |
| `/paiement/circuit/:id` | Payer un circuit |
| `/paiement/hebergement/:id` | Payer un hébergement |
| `/paiement/circuit-personnalise/:id` | Payer un circuit personnalisé |
| `/profil` | Profil utilisateur |

## Espace admin (`/admin/*`)

Accessible uniquement avec le rôle `ADMIN`.

- Tableau de bord avec KPIs
- Gestion circuits, hébergements, actualités
- Gestion réservations (circuits, hébergements, circuits personnalisés)
- Gestion zones géographiques, villes, activités
- Tarifs circuits personnalisés
- Paramètres du site

---

## Build de production

```bash
ng build --configuration production
```

Les fichiers générés se trouvent dans `dist/`. Déployable sur **Netlify**, Vercel, ou tout serveur statique.

### Déploiement Netlify

Ajouter un fichier `public/_redirects` pour gérer le routing Angular :

```
/*    /index.html   200
```

---

## Structure du projet

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
│   └── app.routes.ts       # Routing principal
└── environments/           # Configuration dev / prod
```
