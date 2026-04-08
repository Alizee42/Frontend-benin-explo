import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id?: number;
  email: string;
  role: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motDePasse: string;
}

interface LoginResponse {
  token: string;
  id: number;
  email: string;
  role: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public user$ = this.userSubject.asObservable();
  private readonly ADMIN_ROLES = new Set(['ADMIN', 'ROLE_ADMIN']);

  constructor(
    private http: HttpClient
  ) {
    this.sanitizeStoredSession();
  }

  register(payload: RegisterRequest): Observable<User> {
    return this.http.post<User>('/auth/register', payload);
  }

  login(credentials: { email: string; motDePasse: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        if (response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          const user: User = {
            id: response.id,
            email: response.email,
            role: response.role,
            nom: response.nom,
            prenom: response.prenom,
            telephone: response.telephone
          };
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.userSubject.next(user);
        }
      })
    );
  }

  logout(): void {
    this.clearStoredSession();
    this.userSubject.next(null);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    if (this.isTokenExpired()) {
      this.clearStoredSession();
      this.userSubject.next(null);
      return false;
    }

    return true;
  }

  isAdmin(): boolean {
    const user = this.userSubject.value;
    return this.isAdminRole(user?.role || null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserRole(): string | null {
    const user = this.userSubject.value;
    return user?.role || null;
  }

  private isAdminRole(role: string | null): boolean {
    return !!role && this.ADMIN_ROLES.has(role);
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      
      if (!expiry) return false;
      
      return Date.now() >= expiry * 1000;
    } catch (e) {
      return true;
    }
  }

  getUser(): User | null {
    if (!this.isLoggedIn()) {
      return null;
    }
    return this.userSubject.value;
  }

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private sanitizeStoredSession(): void {
    const token = this.getToken();
    if (!token || this.isTokenExpired() || !this.userSubject.value) {
      this.clearStoredSession();
      this.userSubject.next(null);
    }
  }

  private clearStoredSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}
