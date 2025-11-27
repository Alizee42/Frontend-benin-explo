import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  circuits: any[] = [];
  loading = true;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    console.log('Dashboard component ngOnInit called');
    // Check if admin token exists
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'ADMIN') {
      this.router.navigate(['/login']);
      return;
    }

    // Load admin data
    this.loadCircuits();
  }

  loadCircuits() {
    console.log('Loading circuits from API');
    this.http.get('http://localhost:8080/api/circuits').subscribe({
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

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.router.navigate(['/']);
  }

  editCircuit(id: number) {
    // Navigate to edit page or open modal
    console.log('Edit circuit', id);
  }

  deleteCircuit(id: number) {
    if (confirm('Supprimer ce circuit ?')) {
      this.http.delete(`http://localhost:8080/api/circuits/${id}`).subscribe({
        next: () => {
          this.circuits = this.circuits.filter(c => c.id !== id);
        },
        error: (error) => {
          console.error('Erreur suppression', error);
        }
      });
    }
  }
}