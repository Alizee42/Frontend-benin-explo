# Composant Modal Générique

Un composant modal réutilisable pour Angular avec support des tailles, contenu dynamique et événements.

## Utilisation de base

```html
<app-modal
  title="Mon titre"
  size="medium"
  (close)="onClose()">
  <!-- Contenu de la modale -->
  <p>Contenu ici...</p>

  <!-- Boutons footer (optionnel) -->
  <div modal-footer>
    <button>Annuler</button>
    <button>Confirmer</button>
  </div>
</app-modal>
```

## Propriétés d'entrée

| Propriété | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `title` | `string` | `''` | Titre affiché dans l'en-tête |
| `size` | `'small' \| 'medium' \| 'large' \| 'xlarge'` | `'medium'` | Taille de la modale |
| `showCloseButton` | `boolean` | `true` | Afficher le bouton de fermeture |
| `showFooter` | `boolean` | `true` | Afficher la section footer |
| `closeOnBackdrop` | `boolean` | `true` | Fermer en cliquant sur l'arrière-plan |

## Événements

| Événement | Description |
|-----------|-------------|
| `close` | Émis quand la modale se ferme |

## Tailles disponibles

- `small`: 400px max-width
- `medium`: 600px max-width
- `large`: 800px max-width
- `xlarge`: 1000px max-width

## Contenu dynamique

Utilisez `<ng-content>` pour injecter du contenu :

- **Corps principal**: Contenu normal (injecté automatiquement)
- **Footer**: Utilisez `<div modal-footer>` pour les boutons

## Exemple complet

```typescript
// Dans votre composant
export class MyComponent {
  modal!: ModalComponent;

  openModal() {
    this.modal.open();
  }

  onModalClose() {
    console.log('Modale fermée');
  }
}
```

```html
<app-modal
  #modal
  title="Ajouter un élément"
  size="large"
  (close)="onModalClose()">

  <form>
    <input type="text" placeholder="Nom">
  </form>

  <div modal-footer>
    <button (click)="modal.closeModal()">Annuler</button>
    <button (click)="save()">Enregistrer</button>
  </div>
</app-modal>

<button (click)="openModal()">Ouvrir</button>
```

## Styles

Le composant utilise les variables CSS de la charte graphique :
- `--be-green`: Couleur principale
- `--be-light`: Fond
- `--be-sand`: Fond footer
- `--be-gold`: Accents

## Responsive

Le composant s'adapte automatiquement aux écrans mobiles avec des tailles et padding ajustés.