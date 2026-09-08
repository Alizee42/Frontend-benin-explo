import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';

/**
 * errorInterceptor deconnecte l'utilisateur sur un 401 et redirige hors de l'admin sur un 403.
 * Un bug ici laisserait un utilisateur "coince" avec un token invalide sans etre reellement
 * deconnecte, ou l'ejecterait a tort d'une zone admin legitime. Jamais teste jusqu'ici.
 */
describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => httpMock.verify());

  it('logs out and redirects to /login on a 401 response', () => {
    httpClient.get('/api/reservations/me').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/reservations/me');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], jasmine.objectContaining({ queryParams: jasmine.anything() }));
  });

  it('redirects to / on a 403 response outside the admin area', () => {
    httpClient.get('/api/circuits/999').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/circuits/999');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(router.navigate).toHaveBeenCalledWith(['/']);
    expect(authServiceSpy.logout).not.toHaveBeenCalled();
  });

  it('does not redirect on other error statuses (e.g. 500)', () => {
    httpClient.get('/api/circuits').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/circuits');
    req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(router.navigate).not.toHaveBeenCalled();
    expect(authServiceSpy.logout).not.toHaveBeenCalled();
  });

  it('still propagates the error to the caller after handling it', () => {
    let caughtStatus: number | undefined;

    httpClient.get('/api/circuits').subscribe({
      error: (err) => { caughtStatus = err.status; }
    });

    const req = httpMock.expectOne('/api/circuits');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(caughtStatus).toBe(401);
  });
});
