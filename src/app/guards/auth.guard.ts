import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  
  if (!token) {
    console.warn('🔒 Accès refusé : Aucun token JWT trouvé');
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Vérifier si le token n'est pas expiré
  if (authService.isTokenExpired()) {
    console.warn('🔒 Accès refusé : Token expiré');
    authService.logout();
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Vérifier le rôle ADMIN pour les routes admin
  if (state.url.startsWith('/admin')) {
    const userRole = authService.getUserRole();
    if (userRole !== 'ROLE_ADMIN') {
      console.warn('🔒 Accès refusé : Rôle ADMIN requis');
      router.navigate(['/']);
      return false;
    }
  }

  return true;
};
