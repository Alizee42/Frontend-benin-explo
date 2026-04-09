import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactMessageRequest {
  nom: string;
  email: string;
  sujet: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private http: HttpClient) {}

  sendMessage(data: ContactMessageRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/contact', data);
  }
}
