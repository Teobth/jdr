import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PersonnageService } from '../service/personnageService';
import { AuthService } from '../service/authService';

@Component({
  standalone: true,
  selector: 'app-mon-personnage',
  templateUrl: '../html/monPerso.html',
  styleUrls: ['../css/personnage-detail.css'],
  imports: [CommonModule]
})
export class MonPersonnageComponent {
  private personnageService = inject(PersonnageService);
  private authService = inject(AuthService);

  readonly personnage = computed(() => {
    const nom = this.authService.nomPersonnage();
    if (!nom) return undefined;
    return this.personnageService.personnagesSignal()
      .find(p => p.nom.toLowerCase() === nom.toLowerCase());
  });

  readonly secretsDebloques = computed(() => {
    return this.personnage()?.secrets.filter(s => s.debloque) ?? [];
  });
}