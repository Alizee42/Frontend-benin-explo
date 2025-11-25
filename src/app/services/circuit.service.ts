import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}
