import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { resolveApiUrl } from '../config/api-base-url';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const resolvedUrl = resolveApiUrl(req.url);
  const request = resolvedUrl === req.url ? req : req.clone({ url: resolvedUrl });

  // Ne pas ajouter le token pour les requêtes d'authentification
  if (request.url.includes('/auth/')) {
    return next(request);
  }

  // Ajouter le token JWT dans le header Authorization si présent
  if (token) {
    const clonedRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  return next(request);
};
