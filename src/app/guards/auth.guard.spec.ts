import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

/**
 * authGuard protege les routes privees/admin cote client. C'est de l'UX, pas de la vraie
 * securite (le backend revalide toujours), mais un bug ici laisserait un utilisateur non admin
 * voir une page admin le temps d'un aller-retour reseau, ou bloquerait un utilisateur legitime.
 * Jamais teste jusqu'ici.
 */
describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  function runGuard(url: string) {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url } as any)
    );
  }

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'isTokenExpired', 'isAdmin', 'logout']);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('redirects to /login when there is no token', () => {
    authServiceSpy.getToken.and.returnValue(null);

    const result = runGuard('/dashboard');

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/dashboard' } });
  });

  it('logs out and redirects to /login when the token is expired', () => {
    authServiceSpy.getToken.and.returnValue('some-token');
    authServiceSpy.isTokenExpired.and.returnValue(true);

    const result = runGuard('/dashboard');

    expect(result).toBeFalse();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/dashboard' } });
  });

  it('redirects to / when a non-admin tries to access an /admin route', () => {
    authServiceSpy.getToken.and.returnValue('some-token');
    authServiceSpy.isTokenExpired.and.returnValue(false);
    authServiceSpy.isAdmin.and.returnValue(false);

    const result = runGuard('/admin/dashboard');

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('allows an admin to access an /admin route', () => {
    authServiceSpy.getToken.and.returnValue('some-token');
    authServiceSpy.isTokenExpired.and.returnValue(false);
    authServiceSpy.isAdmin.and.returnValue(true);

    const result = runGuard('/admin/dashboard');

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('allows an authenticated non-admin to access a non-admin private route', () => {
    authServiceSpy.getToken.and.returnValue('some-token');
    authServiceSpy.isTokenExpired.and.returnValue(false);
    authServiceSpy.isAdmin.and.returnValue(false);

    const result = runGuard('/dashboard');

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
