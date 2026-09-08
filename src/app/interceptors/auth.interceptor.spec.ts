import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

/**
 * authInterceptor attache le JWT a chaque requete sortante, sauf vers /auth/*. Un bug ici
 * (token manquant ou envoye a la mauvaise route) casserait silencieusement toute requete
 * authentifiee. Jamais teste jusqu'ici.
 */
describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('attaches the Authorization header when a token is present', () => {
    authServiceSpy.getToken.and.returnValue('my-jwt-token');

    httpClient.get('/api/circuits').subscribe();

    const req = httpMock.expectOne('/api/circuits');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    req.flush({});
  });

  it('does not attach an Authorization header when there is no token', () => {
    authServiceSpy.getToken.and.returnValue(null);

    httpClient.get('/api/circuits').subscribe();

    const req = httpMock.expectOne('/api/circuits');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('never attaches the token to /auth/* requests, even when one is present', () => {
    authServiceSpy.getToken.and.returnValue('my-jwt-token');

    httpClient.post('/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
