
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: '../html/app.html',
  styleUrls: ['../css/app.css'],
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule
]
})
export class App {
  protected title = 'Jeu de Rôle';
}
