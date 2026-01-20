import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HebergementsService, HebergementDTO } from '../../../../services/hebergements.service';

@Component({
  standalone: true,
  selector: 'app-hebergements-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './hebergements-list.component.html',
  styleUrls: ['./hebergements-list.component.scss']
})
export class HebergementsListComponent implements OnInit {
  hebergements: HebergementDTO[] = [];
  loading = true;

  constructor(private hebergementsService: HebergementsService, private router: Router) {}

  ngOnInit(): void {
    this.loadHebergements();
  }

  loadHebergements(): void {
    this.hebergementsService.getAll().subscribe({
      next: (data: HebergementDTO[]) => {
        this.hebergements = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement hébergements', err);
        this.loading = false;
      }
    });
  }

  reserver(hebergement: HebergementDTO): void {
    // Rediriger vers la page de réservation avec l'ID de l'hébergement
    this.router.navigate(['/reservation-hebergement', hebergement.id]);
  }
}