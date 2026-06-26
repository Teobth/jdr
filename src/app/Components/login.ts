import { Component, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../service/authService';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: '../html/login.html',
  styleUrls: ['../css/login.css']
})
export class LoginComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);

  pinSaisi = '';

  constructor() {
    // Si la connexion réussit (signal mis à jour par le service), on redirige.
    effect(() => {
      if (this.authService.estConnecte()) {
        this.router.navigateByUrl('/');
      }
    });
  }

  onValider(): void {
    if (!this.pinSaisi) return;
    this.authService.seConnecter(this.pinSaisi.trim());
  }
}