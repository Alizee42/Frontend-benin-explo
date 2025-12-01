import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: { email: string; motDePasse: string }): Observable<any> {
    // TEMPORARY: Mock login for testing admin pages
    if (credentials.email === 'admin@beninexplo.com' && credentials.motDePasse === 'admin123') {
      const mockResponse = {
        token: 'mock-admin-token',
        email: 'admin@beninexplo.com',
        role: 'ADMIN',
        nom: 'Admin',
        prenom: 'Bénin'
      };

      localStorage.setItem(this.TOKEN_KEY, mockResponse.token);
      const user: User = {
        email: mockResponse.email,
        role: mockResponse.role,
        nom: mockResponse.nom,
        prenom: mockResponse.prenom
      };
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.userSubject.next(user);

      // Redirect to admin dashboard
      this.router.navigate(['/admin/dashboard']);

      return new Observable(observer => {
        observer.next(mockResponse);
        observer.complete();
      });
    }

    // For other credentials, try real API call
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

          // Redirect based on role
          if (response.role === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSubject.next(null);
    this.router.navigate(['/']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.userSubject.value;
    return user?.role === 'ADMIN';
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): User | null {
    return this.userSubject.value;
  }

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }
}