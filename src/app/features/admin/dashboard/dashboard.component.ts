import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { AuthService } from '../../../services/auth.service';
import { CircuitService } from '../../../services/circuit.service';
import { HebergementsService } from '../../../services/hebergements.service';
import { ReservationHebergementService } from '../../../services/reservation-hebergement.service';
import { CircuitsPersonnalisesService } from '../../../services/circuits-personnalises.service';
import { ActivitesService } from '../../../services/activites.service';
import { ZonesAdminService } from '../../../services/zones-admin.service';
import { VillesService } from '../../../services/villes.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  userFirstName: string | undefined;
  lastUpdateLabel = '';
  circuitsPublishedCount = 0;
  reservationsCount = 0;
  pendingRequestsCount = 0;
  catalogueActifCount = 0;
  zonesCount = 0;
  villesCount = 0;
  activitesCount = 0;
  demandesCount = 0;
  hebergementsCount = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private circuitService: CircuitService,
    private hebergementsService: HebergementsService,
    private reservationHebergementService: ReservationHebergementService,
    private circuitsPersonnalisesService: CircuitsPersonnalisesService,
    private activitesService: ActivitesService,
    private zonesAdminService: ZonesAdminService,
    private villesService: VillesService
  ) {}

  ngOnInit() {

    // Check if user is logged in and is admin
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      this.router.navigate(['/login']);
      return;
    }

    const user = this.authService.getUser();
    this.userFirstName = user?.prenom || user?.nom || 'Admin';
    this.lastUpdateLabel = this.formatNow();
    this.loadDashboardStats();
  }

  private formatNow(): string {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(new Date());
  }

  private loadDashboardStats(): void {
    forkJoin({
      circuits: this.circuitService.getAllCircuits().pipe(catchError(() => of([]))),
      hebergements: this.hebergementsService.getAll().pipe(catchError(() => of([]))),
      reservations: this.reservationHebergementService.getAll().pipe(catchError(() => of([]))),
      demandes: this.circuitsPersonnalisesService.getAllDemandes().pipe(catchError(() => of([]))),
      activites: this.activitesService.getAllActivites().pipe(catchError(() => of([]))),
      zones: this.zonesAdminService.getAll().pipe(catchError(() => of([]))),
      villes: this.villesService.getAll().pipe(catchError(() => of([])))
    }).subscribe(({ circuits, hebergements, reservations, demandes, activites, zones, villes }) => {
      const circuitsActifs = circuits.filter((c: any) => c?.actif === true).length;
      const demandesEnAttente = demandes.filter((d: any) =>
        String(d?.statut ?? '').toLowerCase().includes('attente')
      ).length;
      const reservationsEnAttente = reservations.filter((r: any) =>
        String(r?.statut ?? '').toLowerCase().includes('attente')
      ).length;

      this.circuitsPublishedCount = circuitsActifs;
      this.reservationsCount = reservations.length;
      this.pendingRequestsCount = demandesEnAttente + reservationsEnAttente;
      this.catalogueActifCount = circuitsActifs + activites.length + hebergements.length;

      this.zonesCount = zones.length;
      this.villesCount = villes.length;
      this.activitesCount = activites.length;
      this.demandesCount = demandes.length;
      this.hebergementsCount = hebergements.length;
    });
  }
}
