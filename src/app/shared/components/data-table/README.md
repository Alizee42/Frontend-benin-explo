# DataTableComponent

Un composant Angular réutilisable pour afficher des tableaux de données avec des fonctionnalités avancées.

## Fonctionnalités

- ✅ Affichage de données tabulaires
- ✅ Colonnes configurables (types: text, number, date, boolean, array, actions)
- ✅ Actions personnalisables par ligne
- ✅ États de chargement et vide
- ✅ Design responsive et moderne
- ✅ Tri et largeur de colonnes personnalisables
- ✅ Conditions d'affichage des actions

## Utilisation de base

### 1. Importer le composant

```typescript
import { DataTableComponent, TableColumn, TableAction } from './shared/components/data-table/data-table.component';

@Component({
  // ...
  imports: [DataTableComponent],
  // ...
})
```

### 2. Configurer les colonnes et actions

```typescript
export class MyComponent {
  // Configuration des colonnes
  tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number', width: '80px' },
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'prix', label: 'Prix (€)', type: 'number', width: '100px' },
    { key: 'actif', label: 'Actif', type: 'boolean' },
    { key: 'tags', label: 'Tags', type: 'array' },
    { key: 'dateCreation', label: 'Créé le', type: 'date' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '150px' }
  ];

  // Configuration des actions
  tableActions: TableAction[] = [
    {
      label: 'Modifier',
      icon: 'ri-edit-line',
      class: 'btn-edit',
      action: 'edit'
    },
    {
      label: 'Supprimer',
      icon: 'ri-delete-bin-line',
      class: 'btn-delete',
      action: 'delete',
      condition: (item) => item.canDelete // Condition optionnelle
    }
  ];
}
```

### 3. Utiliser dans le template

```html
<app-data-table
  [columns]="tableColumns"
  [data]="myData"
  [loading]="isLoading"
  [actions]="tableActions"
  emptyMessage="Aucune donnée trouvée"
  (actionClick)="onTableAction($event)"
  (rowClick)="onRowClick($event)">
</app-data-table>
```

### 4. Gérer les événements

```typescript
onTableAction(event: {action: string, item: any}) {
  const { action, item } = event;

  switch (action) {
    case 'edit':
      this.editItem(item);
      break;
    case 'delete':
      this.deleteItem(item.id);
      break;
  }
}

onRowClick(item: any) {
  // Navigation ou action sur clic de ligne
  console.log('Row clicked:', item);
}
```

## Interfaces

### TableColumn
```typescript
interface TableColumn {
  key: string;           // Clé de la propriété dans les données
  label: string;         // Label affiché dans l'en-tête
  type?: 'text' | 'number' | 'date' | 'boolean' | 'array' | 'actions';
  sortable?: boolean;    // Colonne triable (futur)
  width?: string;        // Largeur CSS (ex: '100px', '20%')
}
```

### TableAction
```typescript
interface TableAction {
  label: string;                    // Texte du bouton
  icon?: string;                    // Classe CSS de l'icône (RemixIcon)
  class?: string;                   // Classe CSS du bouton
  action: string;                   // Identifiant de l'action
  condition?: (item: any) => boolean; // Condition d'affichage
}
```

## Types de colonnes

- **text**: Texte simple
- **number**: Nombre formaté
- **date**: Date formatée en français
- **boolean**: Oui/Non
- **array**: Tableau joint par des virgules
- **actions**: Colonne des boutons d'action

## Styles personnalisables

Le composant utilise des classes CSS personnalisables :

- `.btn-edit`: Bouton d'édition (doré)
- `.btn-delete`: Bouton de suppression (rouge)
- `.btn-success`: Bouton de succès (vert)
- `.btn-warning`: Bouton d'avertissement (jaune)

## Exemples d'utilisation

### Tableau simple
```typescript
tableColumns: TableColumn[] = [
  { key: 'nom', label: 'Nom' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Rôle' }
];
```

### Tableau avec actions conditionnelles
```typescript
tableActions: TableAction[] = [
  {
    label: 'Activer',
    icon: 'ri-check-line',
    class: 'btn-success',
    action: 'activate',
    condition: (item) => !item.actif
  },
  {
    label: 'Désactiver',
    icon: 'ri-close-line',
    class: 'btn-warning',
    action: 'deactivate',
    condition: (item) => item.actif
  }
];
```

### Tableau responsive
Le composant est automatiquement responsive et s'adapte aux écrans mobiles.