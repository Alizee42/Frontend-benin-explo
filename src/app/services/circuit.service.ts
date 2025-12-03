import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CircuitDTO } from '../models/circuit.dto';

@Injectable({
  providedIn: 'root'
})
export class CircuitService {

  private apiUrl = 'http://localhost:8080/api/circuits';

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

  // Upload an image file to the backend uploads folder.
  // Returns the backend JSON response: { filename: string, url: string }
  uploadImage(file: File, folder?: string): Observable<{ filename: string; url: string }> {
    const uploadUrl = 'http://localhost:8080/api/images/upload';
    const form = new FormData();
    form.append('file', file, file.name);
    if (folder) {
      form.append('folder', folder);
    }
    console.log('[CircuitService] uploadImage -> sending file', file.name, 'folder:', folder);
    return this.http.post<{ filename: string; url: string }>(uploadUrl, form)
      .pipe(
        tap(res => console.log('[CircuitService] uploadImage response:', res))
      );
  }
}
