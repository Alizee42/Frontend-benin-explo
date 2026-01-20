import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivitesService, Activite } from '../../../services/activites.service';
import { ZonesAdminService, ZoneDTO } from '../../../services/zones-admin.service';
import { VillesService, VilleDTO } from '../../../services/villes.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { ActiviteFormComponent } from './activite-form/activite-form.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { MediaService } from '../../../services/media.service';

@Component({
  standalone: true,
  selector: 'app-activites-admin',
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, DataTableComponent, ActiviteFormComponent, ModalComponent],
  templateUrl: './activites-admin.component.html',
  styleUrls: ['./activites-admin.component.scss']
})
export class ActivitesAdminComponent implements OnInit {
  activites: Activite[] = [];
  loading = true;

  // modal / form state
  showModal = false;
  isEditing = false;
  currentActivite: Partial<Activite> = { id: 0, nom: '', description: '', prix: 0, duree: 1, type: 'Culture', zoneId: 0, ville: '', imagePrincipaleId: null };
  zones: ZoneDTO[] = [];
  villes: VilleDTO[] = [];

  tableColumns: TableColumn[] = [
    { key: 'image', label: 'Image', type: 'image', width: '100px' },
    { key: 'id', label: 'ID', type: 'number', width: '80px' },
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'ville', label: 'Ville', type: 'text', width: '160px' },
    { key: 'type', label: 'Type', type: 'text', width: '120px' },
    { key: 'dureeDisplay', label: 'Durée', type: 'text', width: '110px' },
    { key: 'prixDisplay', label: 'Prix (EUR / XOF)', type: 'text', width: '160px' },
    { key: 'zone', label: 'Zone', type: 'text', width: '180px' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '220px' }
  ];

  tableActions: TableAction[] = [
    { label: 'Éditer', icon: 'ri-edit-line', class: 'btn-edit', action: 'edit' },
    { label: 'Supprimer', icon: 'ri-delete-bin-line', class: 'btn-delete', action: 'delete' }
  ];

  constructor(private activitesService: ActivitesService, private zonesService: ZonesAdminService, private villesService: VillesService, private mediaService: MediaService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Load zones and villes first, then activities so we can resolve zone names
    this.loadZonesAndVillesThenActivities();
  }

  loadZonesAndVillesThenActivities() {
    this.zonesService.getAll().subscribe({
      next: (z: ZoneDTO[]) => {
        this.zones = z.map((zz: any) => ({ id: zz.id !== undefined ? zz.id : zz.idZone, nom: zz.nom, description: zz.description, ...zz }));
        this.villesService.getAll().subscribe({
          next: (vs: VilleDTO[]) => {
            this.villes = vs;
            this.loadActivites();
          },
          error: (err: any) => { console.error('Erreur chargement villes', err); this.loadActivites(); }
        });
      },
      error: (err: any) => { console.error('Erreur chargement zones', err); this.loadActivites(); }
    });
  }

  loadActivites() {
    this.loading = true;
    this.activitesService.getAllActivites().subscribe({
      next: (acts: Activite[]) => {
        // resolve zone name for each activity if zones already loaded
        const EUR_TO_XOF = 655.957; // rate for conversion (1 EUR = 655.957 XOF)
        this.activites = acts.map(a => {
          const zoneName = this.zones.find(z => z.id === (a as any).zoneId)?.nom || '';
          const villeName = (() => {
            if (a.ville === undefined || a.ville === null) return '';
            // if ville is an id, try resolve from villes list
            if (typeof a.ville === 'number') {
              const villeId = a.ville as number;
              return this.villes.find(v => v.id === villeId)?.nom || '';
            }
            return (a.ville as any) || '';
          })();

          // format duration: prefer exact minutes if available, otherwise use decimal hours
          const minutes = ((a as any).dureeMinutes != null) ? Number((a as any).dureeMinutes) : Math.round((Number((a as any).duree ?? 0) || 0) * 60);
          const hh = Math.floor(minutes / 60);
          const mm = minutes % 60;
          const dureeDisplay = `${hh}h${mm.toString().padStart(2, '0')}`;

          // format price: EUR with 2 decimals, XOF rounded integer
          const prixNum = (a.prix != null) ? Number(a.prix) : null;
          let prixDisplay = '-';
          if (prixNum !== null && !isNaN(prixNum)) {
            const eur = prixNum.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const xof = Math.round(prixNum * EUR_TO_XOF).toLocaleString('fr-FR');
            prixDisplay = `${eur} € / ${xof} XOF`;
          }

          return { ...a, zone: zoneName, ville: villeName, dureeDisplay, prixDisplay } as Activite;
        });

        // Load image URLs for items that have imagePrincipaleId
        this.activites.forEach(act => {
          const id = act.imagePrincipaleId;
          if (id) {
            this.mediaService.getImageUrl(id).subscribe({
              next: (url) => {
                console.debug('[ActivitesAdmin] resolved image url for id', id, url);
                act.image = url || null;
              },
              error: (err) => {
                console.warn('[ActivitesAdmin] media fetch failed for id', id, err);
                act.image = null;
              }
            });
          }
        });
        this.loading = false;
        // Force change detection for the table
        this.activites = [...this.activites];
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur chargement activités', err);
        this.loading = false;
      }
    });
  }

  onRowClick(item: any) {
    this.openEditModal(item);
  }

  onTableAction(event: { action: string; item: any }) {
    const { action, item } = event;
    if (action === 'edit') this.openEditModal(item);
    if (action === 'delete') this.deleteActivite(item.id);
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentActivite = { id: 0, nom: '', description: '', prix: 0, duree: 1, type: 'Culture', zoneId: 0, ville: '', imagePrincipaleId: null };
    this.showModal = true;
  }

  openEditModal(a: any): void {
    this.isEditing = true;
    this.currentActivite = { ...a };
    // Pour l'édition, si l'activité a une image chargée, la copier dans imagePreview pour l'afficher
    if (a.image) {
      (this.currentActivite as any).imagePreview = a.image;
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveActivite(): void {
    if (this.isEditing && (this.currentActivite as any).id) {
      this.activitesService.updateActivite((this.currentActivite as any).id, this.currentActivite as Partial<Activite>).subscribe({
        next: (resp) => {
          // Recalculer dureeDisplay et prixDisplay pour l'activité mise à jour sans reload complet
          const updated = resp as Activite;
          const zoneName = this.zones.find(z => z.id === (updated as any).zoneId)?.nom || '';
          updated.zone = zoneName;

          // Résoudre le nom de la ville
          let villeName = '';
          const updatedVille = (updated as any).ville;
          if (updatedVille !== undefined && updatedVille !== null) {
            if (typeof updatedVille === 'number') {
              villeName = this.villes.find(v => v.id === updatedVille)?.nom || '';
            } else {
              villeName = updatedVille as string;
            }
          }
          updated.ville = villeName;
          const EUR_TO_XOF = 655.957;
          const minutes = ((updated as any).dureeMinutes != null) ? Number((updated as any).dureeMinutes) : Math.round((Number((updated as any).duree ?? 0) || 0) * 60);
          const hh = Math.floor(minutes / 60);
          const mm = minutes % 60;
          updated.dureeDisplay = `${hh}h${mm.toString().padStart(2, '0')}`;

          const prixNum = (updated.prix != null) ? Number(updated.prix) : null;
          let prixDisplay = '-';
          if (prixNum !== null && !isNaN(prixNum)) {
            const eur = prixNum.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const xof = Math.round(prixNum * EUR_TO_XOF).toLocaleString('fr-FR');
            prixDisplay = `${eur} € / ${xof} XOF`;
          }
          updated.prixDisplay = prixDisplay;

          // Recharger l'image si imagePrincipaleId a changé
          const imgId = (updated as any).imagePrincipaleId;
          if (imgId) {
            this.mediaService.getImageUrl(imgId).subscribe({
              next: (url) => { console.debug('[ActivitesAdmin] resolved image url for updated item id', imgId, url); updated.image = url || null; },
              error: (err) => { console.warn('[ActivitesAdmin] media fetch failed for updated item id', imgId, err); updated.image = null; }
            });
          } else {
            updated.image = null;
          }

          // Mettre à jour dans la liste
          const index = this.activites.findIndex(a => a.id === updated.id);
          if (index >= 0) {
            this.activites[index] = { ...this.activites[index], ...updated };
            this.activites = [...this.activites]; // trigger change detection
          }
          this.closeModal();
        },
        error: (err) => { console.error('[ActivitesAdmin] Erreur update for id', (this.currentActivite as any).id, err); }
      });
    } else {
      const payload = {
        nom: this.currentActivite.nom || '',
        description: this.currentActivite.description || '',
        prix: this.currentActivite.prix ?? null,
        duree: this.currentActivite.duree ?? 1,
        type: (this.currentActivite.type as any) || 'Culture',
        zoneId: this.currentActivite.zoneId || 0,
        // include ville (form binds ville as the name string)
        ville: (this.currentActivite as any).ville ?? null,
        imagePrincipaleId: (this.currentActivite as any).imagePrincipaleId ?? null
      };
      this.activitesService.createActivite(payload).subscribe({
        next: (created) => {
          // Insérer directement l'activité créée dans la liste pour mise à jour instantanée
            const zoneName = this.zones.find(z => z.id === (created as any).zoneId)?.nom || '';
            // résoudre le nom de la ville : backend peut renvoyer `ville` comme string ou id, ou rien
            let villeName = '';
            const createdVille = (created as any).ville;
            if (createdVille !== undefined && createdVille !== null) {
              if (typeof createdVille === 'number') {
                villeName = this.villes.find(v => v.id === createdVille)?.nom || '';
              } else {
                villeName = createdVille as string;
              }
            } else if (this.currentActivite && this.currentActivite.ville) {
              // fallback: utiliser la valeur sélectionnée dans le formulaire
              villeName = this.currentActivite.ville as any as string;
            }

            const createdWithZone: Activite = { ...(created as Activite), zone: zoneName, ville: villeName };

            // Calculer dureeDisplay et prixDisplay pour la nouvelle activité
            const EUR_TO_XOF = 655.957;
            const minutes = ((created as any).dureeMinutes != null) ? Number((created as any).dureeMinutes) : Math.round((Number((created as any).duree ?? 0) || 0) * 60);
            const hh = Math.floor(minutes / 60);
            const mm = minutes % 60;
            const dureeDisplay = `${hh}h${mm.toString().padStart(2, '0')}`;

            const prixNum = (created.prix != null) ? Number(created.prix) : null;
            let prixDisplay = '-';
            if (prixNum !== null && !isNaN(prixNum)) {
              const eur = prixNum.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const xof = Math.round(prixNum * EUR_TO_XOF).toLocaleString('fr-FR');
              prixDisplay = `${eur} € / ${xof} XOF`;
            }

            createdWithZone.dureeDisplay = dureeDisplay;
            createdWithZone.prixDisplay = prixDisplay;

            // si l'activité créée contient un imagePrincipaleId, charger son URL
            const imgId = (created as any).imagePrincipaleId;
            if (imgId) {
              this.mediaService.getImageUrl(imgId).subscribe({
                next: (url) => { console.debug('[ActivitesAdmin] resolved image url for created item id', imgId, url); createdWithZone.image = url || null; },
                error: (err) => { console.warn('[ActivitesAdmin] media fetch failed for created item id', imgId, err); createdWithZone.image = null; }
              });
            }

            // Prévenir doublons : remplacer si existe sinon push
            const existsIndex = this.activites.findIndex(a => a.id === createdWithZone.id);
            if (existsIndex >= 0) {
              this.activites[existsIndex] = createdWithZone;
            } else {
              this.activites = [createdWithZone, ...this.activites];
            }
            this.closeModal();
        },
        error: (err: any) => { console.error('Erreur create', err); }
      });
    }
  }

  onFormSave(payload: Partial<Activite>) {
    this.currentActivite = { ...payload };
    this.saveActivite();
  }

  deleteActivite(id: number) {
    if (!confirm('Supprimer cette activité ?')) return;
    this.activitesService.deleteActivite(id).subscribe({ next: () => { this.loadActivites(); }, error: (err: any) => { console.error('Erreur suppression', err); alert('Impossible de supprimer'); } });
  }
}
