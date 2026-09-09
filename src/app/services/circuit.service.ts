import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CircuitDTO, CircuitPageDTO } from '../models/circuit.dto';

@Injectable({
  providedIn: 'root'
})
export class CircuitService {

  private apiUrl = '/api/circuits';

  constructor(private http: HttpClient) {}

  getAllCircuits(): Observable<CircuitDTO[]> {
    return this.http.get<CircuitDTO[]>(this.apiUrl);
  }

  getActiveCircuits(): Observable<CircuitDTO[]> {
    return this.http.get<CircuitDTO[]>(`${this.apiUrl}/actifs`);
  }

  // Variante paginee cote serveur de getActiveCircuits(), utilisee par la liste publique
  // pour eviter de telecharger le catalogue complet (programme, galerie, points forts inclus)
  // a chaque visite/changement de page/filtre.
  getActiveCircuitsPage(page: number, size: number, zoneId: number | null): Observable<CircuitPageDTO> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (zoneId !== null) {
      params = params.set('zoneId', zoneId);
    }
    return this.http.get<CircuitPageDTO>(`${this.apiUrl}/actifs/page`, { params });
  }

  getCircuitById(id: number): Observable<CircuitDTO> {
    return this.http.get<CircuitDTO>(`${this.apiUrl}/${id}`);
  }

  createCircuit(circuit: Omit<CircuitDTO, 'id'>): Observable<CircuitDTO> {
    return this.http.post<CircuitDTO>(this.apiUrl, circuit);
  }

  updateCircuit(id: number, circuit: Partial<CircuitDTO>): Observable<CircuitDTO> {
    return this.http.put<CircuitDTO>(`${this.apiUrl}/${id}`, circuit);
  }

  deleteCircuit(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Upload an image file to the backend and create a media entry.
  // Returns the backend MediaDTO: { id: number, url: string, type: string, description: string }
  uploadImage(file: File, folder?: string): Observable<{ id: number; url: string; type: string; description: string }> {
    const uploadUrl = '/api/media/upload';
    const form = new FormData();
    form.append('file', file, file.name);
    // Note: /api/media/upload doesn't support folder parameter, stores in uploads/ root
    return this.http.post<{ id: number; url: string; type: string; description: string }>(uploadUrl, form);
  }
}
