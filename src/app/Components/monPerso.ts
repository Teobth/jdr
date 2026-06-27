import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonnageService, FicheCthulhu, Competence } from '../service/personnageService';
import { AuthService } from '../service/authService';

@Component({
  standalone: true,
  selector: 'app-mon-personnage',
  templateUrl: '../html/monPerso.html',
  styleUrls: ['../css/personnage-detail.css', '../css/fiche-personnage.css'],
  imports: [CommonModule]
})
export class MonPersonnageComponent {
  private personnageService = inject(PersonnageService);
  private authService = inject(AuthService);

  /** Bascule entre la vue résumé (existante) et la fiche complète. */
  readonly afficherFicheComplete = signal(false);

  readonly personnage = computed(() => {
    const nom = this.authService.nomPersonnage();
    if (!nom) return undefined;
    return this.personnageService.personnagesSignal()
      .find(p => p.nom.toLowerCase() === nom.toLowerCase());
  });

  readonly secretsDebloques = computed(() => {
    return this.personnage()?.secrets ?? [];
  });

  readonly fiche = computed<FicheCthulhu | undefined>(() => {
    return this.personnage()?.fiche;
  });

  /** Regroupe les compétences en 3 colonnes équilibrées, comme sur la fiche papier. */
  readonly competencesEnColonnes = computed<Competence[][]>(() => {
    const liste = this.fiche()?.competences ?? [];
    const colonnes: Competence[][] = [[], [], []];
    liste.forEach((c, i) => colonnes[i % 3].push(c));
    return colonnes;
  });

  basculerVue(): void {
    this.afficherFicheComplete.update(v => !v);
  }
}