import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CircuitService } from '../../../../services/circuit.service';
import { CircuitDTO } from '../../../../models/circuit.dto';

@Component({
  selector: 'app-circuits-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './circuits-list.component.html',
  styleUrls: ['./circuits-list.component.scss']
})
export class CircuitsListComponent implements OnInit {

  circuits: CircuitDTO[] = [];
  loading = true;

  // 🔹 Circuits de démo (utilisés si la BDD est vide ou en erreur)
  private demoCircuits: CircuitDTO[] = [
    {
      id: 1,
      nom: 'Ouidah Tour',
      description: 'Un circuit culturel intense retraçant l’histoire du Bénin, entre spiritualité Vodoun, mémoire de l’esclavage et détente en bord de mer.',
      dureeIndicative: '1 journée',
      prixIndicatif: 100,
      formuleProposee: 'circuit',
      niveau: 'découverte',
      zoneId: 1,
      activiteIds: []
    },
    {
      id: 2,
      nom: 'Possotome & Popo Tour',
      description: 'Une immersion dans la nature, l’artisanat et les traditions du Mono, entre lac, mer et villages authentiques.',
      dureeIndicative: '1 journée',
      prixIndicatif: 110,
      formuleProposee: 'circuit',
      niveau: 'nature',
      zoneId: 2,
      activiteIds: []
    },
    {
      id: 3,
      nom: 'Abomey Tour',
      description: 'Une plongée dans le royaume du Danxomè : histoire, artisanat, spiritualité et traditions royales.',
      dureeIndicative: '1 journée',
      prixIndicatif: 110,
      formuleProposee: 'circuit',
      niveau: 'culture',
      zoneId: 3,
      activiteIds: []
    },
    {
      id: 4,
      nom: 'Colline Tour - Dassa',
      description: 'Un parcours spirituel au cœur des collines sacrées de Dassa, entre collines, grottes et lieux sacrés.',
      dureeIndicative: '1 journée',
      prixIndicatif: 110,
      formuleProposee: 'circuit',
      niveau: 'spirituel',
      zoneId: 4,
      activiteIds: []
    }
  ];

  // 🔹 Images associées aux circuits (par id, pour le visuel)
  private imageMap: Record<number, string> = {
    1: 'assets/images/esclaves.jpg',
    2: 'assets/images/village.jpg',
    3: 'assets/images/royal-palaces-of-abomey.jpg',
    4: 'assets/images/templepython.jpg'
  };

  constructor(private circuitService: CircuitService) {}

  ngOnInit(): void {
    this.circuitService.getAllCircuits().subscribe({
      next: (data: CircuitDTO[]) => {
        if (data && data.length > 0) {
          this.circuits = data;
        } else {
          // Si aucun circuit en base → on affiche les circuits de démo
          this.circuits = this.demoCircuits;
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement circuits', err);
        this.circuits = this.demoCircuits;
        this.loading = false;
      }
    });
  }

  getImageForCircuit(circuit: CircuitDTO): string {
    return this.imageMap[circuit.id] || 'assets/images/circuit-default.jpg';
  }

  getShortDescription(circuit: CircuitDTO): string {
    const desc = circuit.description || '';
    return desc.length > 140 ? desc.substring(0, 140) + '…' : desc;
  }
}
