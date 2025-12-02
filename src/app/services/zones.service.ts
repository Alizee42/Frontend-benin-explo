import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Zone {
  id: number;
  nom: string;
  region: string;
  description: string;
  zonesProches: string[];
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ZonesService {

  private apiUrl = 'http://localhost:8080/admin/zones';

  constructor(private http: HttpClient) {}

  getAllZones(): Observable<Zone[]> {
    return this.http.get<Zone[]>(this.apiUrl);
  }

  getZoneById(id: number): Observable<Zone> {
    return this.http.get<Zone>(`${this.apiUrl}/${id}`);
  }

  createZone(zone: Omit<Zone, 'id'>): Observable<Zone> {
    return this.http.post<Zone>(this.apiUrl, zone);
  }

  updateZone(id: number, zone: Partial<Zone>): Observable<Zone> {
    return this.http.put<Zone>(`${this.apiUrl}/${id}`, zone);
  }

  deleteZone(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}