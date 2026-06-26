import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarteService, Carte } from '../service/carteService';
import { PersonnageService } from '../service/personnageService';

const TAILLE_HEX = 36;

interface CaseAffichee {
  q: number;
  r: number;
  x: number;
  y: number;
  points: string;
  nomPersonnageSurCase: string | null;
}

@Component({
  standalone: true,
  selector: 'app-admin-carte',
  imports: [CommonModule, FormsModule],
  templateUrl: '../html/admin-carte.html',
  styleUrls: ['../css/admin-carte.css']
})
export class AdminCarteComponent {
  protected carteService = inject(CarteService);
  private personnageService = inject(PersonnageService);

  readonly cartes = computed(() => this.carteService.cartesSignal());

  // Carte actuellement sélectionnée pour édition dans cette vue (pas forcément la carte "active")
  readonly carteEditeeId = signal<number | null>(null);

  readonly carteEditee = computed<Carte | null>(() => {
    const id = this.carteEditeeId();
    return this.cartes().find(c => c.id === id) ?? null;
  });

  // Pion sélectionné pour déplacement libre (clic 1 = sélection, clic 2 = destination)
  readonly pionSelectionne = signal<string | null>(null);

  // Formulaire de création de carte
  nouveauNomCarte = '';
  nouveauRayonCarte = 4;

  // Formulaire d'ajout de pion
  personnageAAjouter = '';

  readonly personnagesDisponibles = computed(() => {
    const carte = this.carteEditee();
    if (!carte) return [];
    const nomsDejaPlaces = new Set(carte.pions.map(p => p.nomPersonnage));
    return this.personnageService.personnagesSignal()
      .filter(p => !nomsDejaPlaces.has(p.nom));
  });

  readonly dimensionsSvg = computed(() => {
    const carte = this.carteEditee();
    if (!carte) return { largeur: 200, hauteur: 200, offsetX: 100, offsetY: 100 };
    return this.carteService.getDimensionsViewBox(carte.rayon, TAILLE_HEX);
  });

  readonly cases = computed<CaseAffichee[]>(() => {
    const carte = this.carteEditee();
    if (!carte) return [];

    const { offsetX, offsetY } = this.dimensionsSvg();
    const toutesLesCases = this.carteService.genererCasesGrille(carte.rayon);

    return toutesLesCases.map(({ q, r }) => {
      const { x, y } = this.carteService.axialVersPixel(q, r, TAILLE_HEX);
      const pionSurCase = carte.pions.find(p => p.q === q && p.r === r);
      const cx = x + offsetX;
      const cy = y + offsetY;

      return {
        q, r,
        x: cx,
        y: cy,
        points: this.carteService.pointsHexagone(cx, cy, TAILLE_HEX - 2),
        nomPersonnageSurCase: pionSurCase?.nomPersonnage ?? null
      };
    });
  });

  getNomAffiche(nomPersonnage: string | null): string {
    if (!nomPersonnage) return '';
    return nomPersonnage
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  selectionnerCarteEditee(id: number): void {
    this.carteEditeeId.set(id);
    this.pionSelectionne.set(null);
  }

  onClickCase(c: CaseAffichee): void {
    const carte = this.carteEditee();
    if (!carte) return;

    const enCoursDeSelection = this.pionSelectionne();

    if (enCoursDeSelection) {
      // Deuxième clic : on déplace le pion sélectionné vers cette case (si elle est libre)
      if (!c.nomPersonnageSurCase) {
        this.carteService.mjDeplacerPion(carte.id, enCoursDeSelection, c.q, c.r);
      }
      this.pionSelectionne.set(null);
      return;
    }

    // Premier clic : si la case a un pion, on le sélectionne pour le déplacer
    if (c.nomPersonnageSurCase) {
      this.pionSelectionne.set(c.nomPersonnageSurCase);
    }
  }

  annulerSelection(): void {
    this.pionSelectionne.set(null);
  }

  onCreerCarte(): void {
    if (!this.nouveauNomCarte.trim() || this.nouveauRayonCarte < 1) return;
    this.carteService.mjCreerCarte(this.nouveauNomCarte.trim(), this.nouveauRayonCarte);
    this.nouveauNomCarte = '';
    this.nouveauRayonCarte = 4;
  }

  onActiverCarte(carteId: number): void {
    this.carteService.mjActiverCarte(carteId);
  }

  onSupprimerCarte(carteId: number): void {
    this.carteService.mjSupprimerCarte(carteId);
    if (this.carteEditeeId() === carteId) {
      this.carteEditeeId.set(null);
    }
  }

  onAjouterPion(): void {
    const carte = this.carteEditee();
    if (!carte || !this.personnageAAjouter) return;
    this.carteService.mjAjouterPion(carte.id, this.personnageAAjouter, 0, 0);
    this.personnageAAjouter = '';
  }

  onRetirerPion(nomPersonnage: string): void {
    const carte = this.carteEditee();
    if (!carte) return;
    this.carteService.mjRetirerPion(carte.id, nomPersonnage);
    if (this.pionSelectionne() === nomPersonnage) {
      this.pionSelectionne.set(null);
    }
  }
}