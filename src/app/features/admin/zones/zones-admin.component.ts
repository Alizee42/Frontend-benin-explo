import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ZonesService, Zone } from '../../../services/zones.service';
import { ZoneFormComponent } from './zone-form/zone-form.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  standalone: true,
  selector: 'app-zones-admin',
  imports: [CommonModule, RouterModule, ZoneFormComponent, HeaderComponent],
  templateUrl: './zones-admin.component.html',
  styleUrls: ['./zones-admin.component.scss']
})
export class ZonesAdminComponent {
  zones: Zone[] = [];
  loading = true;
  showCreate = false;
  editing: Zone | null = null;

  constructor(private zonesService: ZonesService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.zonesService.getAllZones().subscribe({ next: z => { this.zones = z; this.loading = false }, error: e => { console.error(e); this.loading = false } });
  }

  startCreate() {
    this.editing = null;
    this.showCreate = true;
  }

  onSaved(zone: Zone) {
    this.showCreate = false;
    this.editing = null;
    this.load();
  }

  onCancelled() {
    this.showCreate = false;
    this.editing = null;
  }

  edit(zone: Zone) {
    this.editing = zone;
    this.showCreate = true;
  }

  delete(zone: Zone) {
    if (!confirm('Supprimer la zone "' + zone.nom + '" ?')) return;
    this.zonesService.deleteZone(zone.id).subscribe({ next: () => this.load(), error: e => { console.error(e); alert('Impossible de supprimer la zone'); } });
  }
}
