import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-circuits-admin',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './circuits-admin.component.html',
  styleUrls: ['./circuits-admin.component.scss']
})
export class CircuitsAdminComponent implements OnInit {
  circuits: any[] = [];
  loading = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Check if user is logged in and is admin
    if (!this.authService.isLoggedIn() || !this.authService.isAdmin()) {
      this.router.navigate(['/login']);
      return;
    }

    // Load circuits
    this.loadCircuits();
  }

  loadCircuits() {
    console.log('Loading circuits from API');
    this.http.get('/api/circuits').subscribe({
      next: (data: any) => {
        console.log('Circuits loaded:', data);
        this.circuits = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur chargement circuits', error);
        this.loading = false;
      }
    });
  }

  editCircuit(circuit: any) {
    // TODO: Implement edit
    alert('Edition à implémenter: ' + circuit.nom);
  }

  deleteCircuit(id: number) {
    if (confirm('Supprimer ce circuit ?')) {
      this.http.delete(`/api/circuits/${id}`).subscribe({
        next: () => {
          this.circuits = this.circuits.filter(c => c.id !== id);
        },
        error: (error) => {
          console.error('Erreur suppression', error);
        }
      });
    }
  }

  addCircuit() {
    // TODO: Implement add
    alert('Ajout à implémenter');
  }
}