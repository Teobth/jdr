import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './authService';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estMJ()) {
    return true;
  }

  // Pas MJ : on renvoie vers l'accueil si connecté, sinon vers le login
  router.navigate([authService.estConnecte() ? '/' : '/login']);
  return false;
};