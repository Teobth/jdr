import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [
    RouterOutlet, // Permet d'utiliser <router-outlet>
    RouterLink,    // Permet d'utiliser la directive routerLink dans la balise <a>
    RouterLinkActive,
    CommonModule
  ]
})
export class App {
  protected title = 'Jeu de Rôle';
}
