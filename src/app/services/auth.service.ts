import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  email: string;
  role: string;
  nom?: string;
  prenom?: string;
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
  ) {}

  login(credentials: { email: string; motDePasse: string }): Observable<any> {
    return this.http.post('/auth/login', credentials).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          const user: User = {
            email: response.email,
            role: response.role,
            nom: response.nom,
            prenom: response.prenom
          };
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.userSubject.next(user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
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
    return this.userSubject.value;
  }

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }
}
