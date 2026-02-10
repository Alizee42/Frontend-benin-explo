import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CircuitDTO } from '../models/circuit.dto';

@Injectable({
  providedIn: 'root'
})
export class CircuitService {

  private apiUrl = '/api/circuits';

  constructor(private http: HttpClient) {}

  getAllCircuits(): Observable<CircuitDTO[]> {
    return this.http.get<CircuitDTO[]>(this.apiUrl);
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
