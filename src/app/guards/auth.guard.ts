import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  
  if (!token) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (authService.isTokenExpired()) {
    authService.logout();
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (state.url.startsWith('/admin') && !authService.isAdmin()) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
