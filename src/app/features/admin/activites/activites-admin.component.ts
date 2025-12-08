import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActivitesService, Activite } from '../../../services/activites.service';
import { ZonesAdminService, ZoneDTO } from '../../../services/zones-admin.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { ActiviteFormComponent } from './activite-form/activite-form.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

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
  currentActivite: Partial<Activite> = { id: 0, nom: '', description: '', prix: 0, duree: 60, type: 'Culture', zoneId: 0 };
  zones: ZoneDTO[] = [];

  tableColumns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number', width: '80px' },
    { key: 'nom', label: 'Nom', type: 'text' },
    { key: 'type', label: 'Type', type: 'text', width: '140px' },
    { key: 'duree', label: 'Durée (min)', type: 'number', width: '120px' },
    { key: 'prix', label: 'Prix', type: 'number', width: '120px' },
    { key: 'zone', label: 'Zone', type: 'text', width: '180px' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '220px' }
  ];

  tableActions: TableAction[] = [
    { label: 'Éditer', icon: 'ri-edit-line', class: 'btn-edit', action: 'edit' },
    { label: 'Supprimer', icon: 'ri-delete-bin-line', class: 'btn-delete', action: 'delete' }
  ];

  constructor(private activitesService: ActivitesService, private zonesService: ZonesAdminService) {}

  ngOnInit(): void {
    this.loadActivites();
    this.loadZones();
  }

  loadZones() {
    this.zonesService.getAll().subscribe({ next: (z: ZoneDTO[]) => { this.zones = z.map((zz: any) => ({ id: zz.id !== undefined ? zz.id : zz.idZone, nom: zz.nom, description: zz.description, ...zz })); }, error: (err: any) => { console.error('Erreur chargement zones', err); } });
  }

  loadActivites() {
    this.loading = true;
    this.activitesService.getAllActivites().subscribe({ next: (acts: Activite[]) => { this.activites = acts; this.loading = false; }, error: (err: any) => { console.error('Erreur chargement activités', err); this.loading = false; } });
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
    this.currentActivite = { id: 0, nom: '', description: '', prix: 0, duree: 60, type: 'Culture', zoneId: 0 };
    this.showModal = true;
  }

  openEditModal(a: any): void {
    this.isEditing = true;
    this.currentActivite = { ...a };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveActivite(): void {
    if (this.isEditing && (this.currentActivite as any).id) {
      this.activitesService.updateActivite((this.currentActivite as any).id, this.currentActivite as Partial<Activite>).subscribe({ next: () => { this.loadActivites(); this.closeModal(); }, error: (err: any) => { console.error('Erreur update', err); } });
    } else {
      const payload = { nom: this.currentActivite.nom || '', description: this.currentActivite.description || '', prix: this.currentActivite.prix || 0, duree: this.currentActivite.duree || 60, type: (this.currentActivite.type as any) || 'Culture', zoneId: this.currentActivite.zoneId || 0 };
      this.activitesService.createActivite(payload).subscribe({ next: () => { this.loadActivites(); this.closeModal(); }, error: (err: any) => { console.error('Erreur create', err); } });
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
