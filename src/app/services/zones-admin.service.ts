import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ZoneDTO {
  id: number;
  nom: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class ZonesAdminService {

  private apiUrl = '/api/zones';

  constructor(private http: HttpClient) { }

  getAll(): Observable<ZoneDTO[]> {
    return this.http.get<ZoneDTO[]>(this.apiUrl);
  }

  getById(id: number): Observable<ZoneDTO> {
    return this.http.get<ZoneDTO>(`${this.apiUrl}/${id}`);
  }

  create(zone: ZoneDTO): Observable<ZoneDTO> {
    return this.http.post<ZoneDTO>(this.apiUrl, zone);
  }

  update(id: number, zone: ZoneDTO): Observable<ZoneDTO> {
    return this.http.put<ZoneDTO>(`${this.apiUrl}/${id}`, zone);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}