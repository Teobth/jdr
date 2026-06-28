import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../service/authService';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: '../html/app.html',
  styleUrls: ['../css/app.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule
]
})
export class App {
  protected title = 'Jeu de Rôle';
  protected authService = inject(AuthService);
  private router = inject(Router);

  onDeconnexion(): void {
    this.authService.seDeconnecter();
    this.router.navigateByUrl('/login');
  }
}