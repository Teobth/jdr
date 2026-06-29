import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CarteService } from '../service/carteService';
import { AuthService } from '../service/authService';
import { PersonnageService } from '../service/personnageService';
import { getTypeDecor } from '../service/decorsService';

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
  decorSvg: SafeHtml | null;
  segmentsMurs: { x1: number; y1: number; x2: number; y2: number }[];
}

/** Une entrée de la légende : initiale(s) affichée(s) sur la carte -> nom complet du personnage. */
interface EntreeLegende {
  initiales: string;
  nomComplet: string;
  estMoi: boolean;
}

@Component({
  standalone: true,
  selector: 'app-carte',
  imports: [CommonModule],
  templateUrl: '../html/carte.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['../css/carte.css']
})
export class CarteComponent {
  private carteService = inject(CarteService);
  private authService = inject(AuthService);
  private personnageService = inject(PersonnageService);
  private sanitizer = inject(DomSanitizer);

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
    const decors = carte.decors ?? [];
    const murs = carte.murs ?? [];

    return toutesLesCases.map(({ q, r }) => {
      const { x, y } = this.carteService.axialVersPixel(q, r, TAILLE_HEX);
      const pionSurCase = carte.pions.find(p => p.q === q && p.r === r);
      const decorSurCase = decors.find(d => d.q === q && d.r === r);
      const estAdjacente = monPion
        ? this.carteService.sontAdjacentes(monPion.q, monPion.r, q, r)
          && !pionSurCase
          && !this.carteService.existeMurEntre(carte, monPion.q, monPion.r, q, r)
        : false;

      const cx = x + offsetX;
      const cy = y + offsetY;
      const typeDecor = decorSurCase ? getTypeDecor(decorSurCase.type) : undefined;

      const mursDeLaCase = murs.filter(m => m.q === q && m.r === r);
      const segmentsMurs = mursDeLaCase.map(m => this.carteService.segmentCote(cx, cy, TAILLE_HEX, m.cote));

      return {
        q, r,
        x: cx,
        y: cy,
        points: this.carteService.pointsHexagone(cx, cy, TAILLE_HEX - 2),
        nomPersonnageSurCase: pionSurCase?.nomPersonnage ?? null,
        estMonPion: pionSurCase?.nomPersonnage.toLowerCase() === this.monNom()?.toLowerCase(),
        estAdjacenteAuMonPion: estAdjacente,
        decorSvg: typeDecor
          ? this.sanitizer.bypassSecurityTrustHtml(typeDecor.rendu(cx, cy, TAILLE_HEX * 0.6))
          : null,
        segmentsMurs
      };
    });
  });

  /**
   * Légende statique : pour chaque pion réellement présent sur la carte active,
   * associe les initiales affichées dans l'hexagone à son nom complet, pour
   * permettre au joueur de s'y retrouver sans deviner qui est qui.
   */
  readonly legendePions = computed<EntreeLegende[]>(() => {
    const carte = this.carte();
    if (!carte) return [];

    const monNom = this.monNom()?.toLowerCase();

    // On garde l'ordre d'apparition des pions tel que défini sur la carte, sans doublons.
    const nomsVus = new Set<string>();
    const entrees: EntreeLegende[] = [];

    for (const pion of carte.pions) {
      if (nomsVus.has(pion.nomPersonnage)) continue;
      nomsVus.add(pion.nomPersonnage);

      entrees.push({
        initiales: this.getNomAffiche(pion.nomPersonnage),
        nomComplet: pion.nomPersonnage,
        estMoi: pion.nomPersonnage.toLowerCase() === monNom
      });
    }

    return entrees;
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