import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TarifsCircuitPersonnaliseDTO {
  id?: number;
  devise: string;
  transportCompactParJour: number;
  transportFamilialParJour: number;
  transportMinibusParJour: number;
  transportBusParJour: number;
  guideParJour: number;
  chauffeurParJour: number;
  pensionCompleteParPersonneParJour: number;
}

@Injectable({
  providedIn: 'root'
})
export class TarifsCircuitPersonnaliseService {
  private apiUrl = '/api/tarifs-circuit-personnalise';

  constructor(private http: HttpClient) {}

  getCurrent(): Observable<TarifsCircuitPersonnaliseDTO> {
    return this.http.get<TarifsCircuitPersonnaliseDTO>(this.apiUrl);
  }

  save(tarifs: TarifsCircuitPersonnaliseDTO): Observable<TarifsCircuitPersonnaliseDTO> {
    if (tarifs.id) {
      return this.http.put<TarifsCircuitPersonnaliseDTO>(`${this.apiUrl}/${tarifs.id}`, tarifs);
    }
    return this.http.post<TarifsCircuitPersonnaliseDTO>(this.apiUrl, tarifs);
  }
}
