import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarteService } from '../service/carteService';
import { AuthService } from '../service/authService';
import { PersonnageService } from '../service/personnageService';

const TAILLE_HEX = 40;

interface CaseAffichee {
  q: number;
  r: number;
  x: number;
  y: number;
  points: string;
  nomPersonnageSurCase: string | null;
  estMonPion: boolean;
  estAdjacenteAuMonPion: boolean;
}

@Component({
  standalone: true,
  selector: 'app-carte',
  imports: [CommonModule],
  templateUrl: '../html/carte.html',
  styleUrls: ['../css/carte.css']
})
export class CarteComponent {
  private carteService = inject(CarteService);
  private authService = inject(AuthService);
  private personnageService = inject(PersonnageService);

  readonly carte = computed(() => this.carteService.carteActive());

  readonly monNom = computed(() => this.authService.nomPersonnage());

  readonly monPion = computed(() => {
    const carte = this.carte();
    const nom = this.monNom();
    if (!carte || !nom) return null;
    return carte.pions.find(p => p.nomPersonnage.toLowerCase() === nom.toLowerCase()) ?? null;
  });

  readonly dimensionsSvg = computed(() => {
    const carte = this.carte();
    if (!carte) return { largeur: 200, hauteur: 200, offsetX: 100, offsetY: 100 };
    return this.carteService.getDimensionsViewBox(carte.rayon, TAILLE_HEX);
  });

  /** Toutes les cases de la grille active, avec leurs infos d'affichage. */
  readonly cases = computed<CaseAffichee[]>(() => {
    const carte = this.carte();
    if (!carte) return [];

    const monPion = this.monPion();
    const { offsetX, offsetY } = this.dimensionsSvg();
    const toutesLesCases = this.carteService.genererCasesGrille(carte.rayon);

    return toutesLesCases.map(({ q, r }) => {
      const { x, y } = this.carteService.axialVersPixel(q, r, TAILLE_HEX);
      const pionSurCase = carte.pions.find(p => p.q === q && p.r === r);
      const estAdjacente = monPion
        ? this.carteService.sontAdjacentes(monPion.q, monPion.r, q, r) && !pionSurCase
        : false;

      const cx = x + offsetX;
      const cy = y + offsetY;

      return {
        q, r,
        x: cx,
        y: cy,
        points: this.carteService.pointsHexagone(cx, cy, TAILLE_HEX - 2),
        nomPersonnageSurCase: pionSurCase?.nomPersonnage ?? null,
        estMonPion: pionSurCase?.nomPersonnage.toLowerCase() === this.monNom()?.toLowerCase(),
        estAdjacenteAuMonPion: estAdjacente
      };
    });
  });

  getNomAffiche(nomPersonnage: string | null): string {
    if (!nomPersonnage) return '';
    // Initiales pour un affichage compact dans l'hexagone
    return nomPersonnage
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  onClickCase(c: CaseAffichee): void {
    if (!c.estAdjacenteAuMonPion) return;
    const nom = this.monNom();
    if (!nom) return;
    this.carteService.deplacerMonPion(nom, c.q, c.r);
  }
}