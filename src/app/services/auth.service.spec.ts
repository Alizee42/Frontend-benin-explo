import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

/**
 * AuthService gere le JWT stocke cote client (localStorage) : expiration, role admin,
 * nettoyage de session. Jamais teste jusqu'ici malgre son role central dans la securite
 * cote client (chaque guard/interceptor en depend). localStorage est vide entre chaque test
 * pour eviter toute fuite d'etat.
 */
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  function fakeJwt(payload: object): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.fake-signature`;
  }

  function futureToken(role = 'USER'): string {
    return fakeJwt({ sub: 'user@example.com', role, exp: Math.floor(Date.now() / 1000) + 3600 });
  }

  function expiredToken(role = 'USER'): string {
    return fakeJwt({ sub: 'user@example.com', role, exp: Math.floor(Date.now() / 1000) - 3600 });
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function createService(): AuthService {
    service = TestBed.inject(AuthService);
    return service;
  }

  describe('isTokenExpired', () => {
    it('returns true when there is no token', () => {
      createService();
      expect(service.isTokenExpired()).toBeTrue();
    });

    it('returns false for a token whose exp is in the future', () => {
      // sanitizeStoredSession() (appele au constructeur) efface le token si aucun user_data
      // n'accompagne un token pourtant valide : il faut donc les deux pour isoler isTokenExpired.
      localStorage.setItem('auth_token', futureToken());
      localStorage.setItem('user_data', JSON.stringify({ email: 'user@example.com', role: 'USER' }));
      createService();
      expect(service.isTokenExpired()).toBeFalse();
    });

    it('returns true for a token whose exp is in the past', () => {
      localStorage.setItem('auth_token', expiredToken());
      localStorage.setItem('user_data', JSON.stringify({ email: 'user@example.com', role: 'USER' }));
      createService();
      expect(service.isTokenExpired()).toBeTrue();
    });

    it('returns true for a malformed token instead of throwing', () => {
      localStorage.setItem('auth_token', 'not-a-real-jwt');
      localStorage.setItem('user_data', JSON.stringify({ email: 'user@example.com', role: 'USER' }));
      createService();
      expect(service.isTokenExpired()).toBeTrue();
    });
  });

  describe('sanitizeStoredSession (constructor)', () => {
    it('clears a stored expired session on startup', () => {
      localStorage.setItem('auth_token', expiredToken());
      localStorage.setItem('user_data', JSON.stringify({ email: 'user@example.com', role: 'USER' }));

      createService();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(service.getUser()).toBeNull();
    });

    it('clears a valid token that has no matching user_data (inconsistent storage)', () => {
      // Comportement reel decouvert en testant : un token valide seul, sans user_data associe,
      // est considere comme une session corrompue et efface au demarrage - pas seulement les
      // tokens expires.
      localStorage.setItem('auth_token', futureToken());

      createService();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('keeps a valid session (token + user_data) on startup', () => {
      localStorage.setItem('auth_token', futureToken());
      localStorage.setItem('user_data', JSON.stringify({ email: 'user@example.com', role: 'USER' }));

      createService();

      expect(service.isLoggedIn()).toBeTrue();
    });
  });

  describe('isAdmin', () => {
    it('returns true for role ADMIN', () => {
      localStorage.setItem('auth_token', futureToken('ADMIN'));
      localStorage.setItem('user_data', JSON.stringify({ email: 'admin@example.com', role: 'ADMIN' }));
      createService();
      expect(service.isAdmin()).toBeTrue();
    });

    it('returns true for role ROLE_ADMIN', () => {
      localStorage.setItem('auth_token', futureToken('ROLE_ADMIN'));
      localStorage.setItem('user_data', JSON.stringify({ email: 'admin@example.com', role: 'ROLE_ADMIN' }));
      createService();
      expect(service.isAdmin()).toBeTrue();
    });

    it('returns false for role USER', () => {
      localStorage.setItem('auth_token', futureToken('USER'));
      localStorage.setItem('user_data', JSON.stringify({ email: 'user@example.com', role: 'USER' }));
      createService();
      expect(service.isAdmin()).toBeFalse();
    });

    it('returns false when no user is logged in', () => {
      createService();
      expect(service.isAdmin()).toBeFalse();
    });
  });

  describe('login', () => {
    it('stores the token and user data on successful login', () => {
      createService();

      service.login({ email: 'user@example.com', motDePasse: 'secret' }).subscribe();

      const req = httpMock.expectOne('/auth/login');
      req.flush({
        token: futureToken('USER'),
        id: 1,
        email: 'user@example.com',
        role: 'USER',
        nom: 'Doe',
        prenom: 'Jane'
      });

      expect(service.isLoggedIn()).toBeTrue();
      expect(service.getUser()?.email).toBe('user@example.com');
    });

    it('does not store anything when the response has no token', () => {
      createService();

      service.login({ email: 'user@example.com', motDePasse: 'secret' }).subscribe();

      const req = httpMock.expectOne('/auth/login');
      req.flush({ token: '', id: 1, email: 'user@example.com', role: 'USER' } as any);

      expect(service.isLoggedIn()).toBeFalse();
    });
  });

  describe('logout', () => {
    it('clears the stored session and notifies user$', () => {
      localStorage.setItem('auth_token', futureToken());
      localStorage.setItem('user_data', JSON.stringify({ email: 'user@example.com', role: 'USER' }));
      createService();
      expect(service.isLoggedIn()).toBeTrue();

      service.logout();

      expect(service.isLoggedIn()).toBeFalse();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('clears an expired session as a side effect and returns false', () => {
      localStorage.setItem('auth_token', expiredToken());
      localStorage.setItem('user_data', JSON.stringify({ email: 'user@example.com', role: 'USER' }));
      createService();

      // sanitizeStoredSession() a deja nettoye au constructeur ; on verifie que isLoggedIn()
      // reste coherent et ne relance pas d'etat "connecte" par erreur.
      expect(service.isLoggedIn()).toBeFalse();
      expect(service.getUser()).toBeNull();
    });
  });
});
