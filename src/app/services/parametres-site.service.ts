import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ParametresSiteDTO {
  id?: number;
  emailContact?: string | null;
  telephoneContact?: string | null;
  adresseAgence?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ParametresSiteService {
  private readonly apiUrl = '/api/parametres-site';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ParametresSiteDTO[]> {
    return this.http.get<ParametresSiteDTO[]>(this.apiUrl);
  }

  getPrimary(): Observable<ParametresSiteDTO | null> {
    return this.getAll().pipe(
      map((items) => items?.[0] ?? null)
    );
  }
}
