import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';
import { UtilisateursComponent } from './utilisateurs.component';
import { AuthService } from '../../../services/auth.service';

/**
 * Le seul point vraiment sensible de ce composant : le garde-fou qui empeche un admin
 * de modifier son propre role (deja applique cote backend, mais l'UI doit aussi le
 * refleter pour eviter une tentative inutile qui echouerait silencieusement).
 */
describe('UtilisateursComponent', () => {
  let component: UtilisateursComponent;
  let httpMock: HttpTestingController;

  function setup(currentUserEmail: string | null) {
    TestBed.configureTestingModule({
      imports: [UtilisateursComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            getUser: () => (currentUserEmail ? { email: currentUserEmail } : null),
            isLoggedIn: () => true,
            isAdmin: () => true,
            user$: of(null)
          }
        }
      ]
    });

    const fixture = TestBed.createComponent(UtilisateursComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const req = httpMock.expectOne('/admin/utilisateurs');
    req.flush([
      { id: 1, nom: 'Admin', prenom: 'Site', email: 'admin@beninexplo.local', telephone: null, role: 'ADMIN' },
      { id: 2, nom: 'Doe', prenom: 'Jane', email: 'jane@example.com', telephone: null, role: 'USER' }
    ]);
  }

  afterEach(() => httpMock.verify());

  it('marks the modal read-only when editing the currently logged-in admin', () => {
    setup('admin@beninexplo.local');

    component.openEditModal(component.utilisateurs[0]);

    expect(component.isSelf).toBeTrue();
    expect(component.formError).toContain('propre rôle');
  });

  it('allows editing another user role normally', () => {
    setup('admin@beninexplo.local');

    component.openEditModal(component.utilisateurs[1]);

    expect(component.isSelf).toBeFalse();
    expect(component.formError).toBe('');
  });

  it('saveRole() does nothing when isSelf is true, even if called directly', () => {
    setup('admin@beninexplo.local');
    component.openEditModal(component.utilisateurs[0]);

    component.saveRole();

    httpMock.expectNone('/admin/utilisateurs/1/role');
  });

  it('saveRole() sends the PATCH request for another user', () => {
    setup('admin@beninexplo.local');
    component.openEditModal(component.utilisateurs[1]);
    component.selectedRole = 'ADMIN';

    component.saveRole();

    const req = httpMock.expectOne('/admin/utilisateurs/2/role');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: 'ADMIN' });
    req.flush({ id: 2, nom: 'Doe', prenom: 'Jane', email: 'jane@example.com', telephone: null, role: 'ADMIN' });

    const reload = httpMock.expectOne('/admin/utilisateurs');
    reload.flush([]);
  });
});
