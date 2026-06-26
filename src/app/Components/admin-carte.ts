import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CarteService, Carte } from '../service/carteService';
import { PersonnageService } from '../service/personnageService';
import { TYPES_DECOR, getTypeDecor, LABELS_CATEGORIES, CategorieDecor } from '../service/decorsService';

const TAILLE_HEX = 36;

interface CoteAffiche {
  cote: number;
  x1: number; y1: number;
  x2: number; y2: number;
  xMid: number; yMid: number;
  actif: boolean;
}

interface CaseAffichee {
  q: number;
  r: number;
  x: number;
  y: number;
  points: string;
  nomPersonnageSurCase: string | null;
  decorSvg: SafeHtml | null;
  cotesMurs: CoteAffiche[];
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
  private sanitizer = inject(DomSanitizer);

  readonly cartes = computed(() => this.carteService.cartesSignal());

  // Carte actuellement sélectionnée pour édition dans cette vue (pas forcément la carte "active")
  readonly carteEditeeId = signal<number | null>(null);

  readonly carteEditee = computed<Carte | null>(() => {
    const id = this.carteEditeeId();
    return this.cartes().find(c => c.id === id) ?? null;
  });

  // Pion sélectionné pour déplacement libre (clic 1 = sélection, clic 2 = destination)
  readonly pionSelectionne = signal<string | null>(null);

  // Pinceau de décor actuellement sélectionné dans la palette (null = aucun, "GOMME" = effacer)
  readonly decorSelectionne = signal<string | null>(null);

  // Mode "pose de murs" activé indépendamment (les deux peuvent être actifs, le mur a priorité sur clic de bord)
  readonly modeMur = signal<boolean>(false);

  readonly categoriesDecors = computed(() => {
    const groupes = new Map<CategorieDecor, typeof TYPES_DECOR>();
    for (const decor of TYPES_DECOR) {
      const liste = groupes.get(decor.categorie) ?? [];
      liste.push(decor);
      groupes.set(decor.categorie, liste);
    }
    return Array.from(groupes.entries()).map(([categorie, decors]) => ({
      categorie,
      label: LABELS_CATEGORIES[categorie],
      decors
    }));
  });

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
    const decors = carte.decors ?? [];
    const murs = carte.murs ?? [];

    return toutesLesCases.map(({ q, r }) => {
      const { x, y } = this.carteService.axialVersPixel(q, r, TAILLE_HEX);
      const pionSurCase = carte.pions.find(p => p.q === q && p.r === r);
      const decorSurCase = decors.find(d => d.q === q && d.r === r);
      const cx = x + offsetX;
      const cy = y + offsetY;

      const typeDecor = decorSurCase ? getTypeDecor(decorSurCase.type) : undefined;

      const cotesMurs = this.carteService.tousLesCotes(cx, cy, TAILLE_HEX).map(c => ({
        ...c,
        actif: murs.some(m => m.q === q && m.r === r && m.cote === c.cote)
      }));

      return {
        q, r,
        x: cx,
        y: cy,
        points: this.carteService.pointsHexagone(cx, cy, TAILLE_HEX - 2),
        nomPersonnageSurCase: pionSurCase?.nomPersonnage ?? null,
        decorSvg: typeDecor
          ? this.sanitizer.bypassSecurityTrustHtml(typeDecor.rendu(cx, cy, TAILLE_HEX * 0.6))
          : null,
        cotesMurs
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

    // En mode pose de murs, le clic sur le centre de la case ne fait rien :
    // seules les poignées de bord (onClickCote) sont actives.
    if (this.modeMur()) return;

    // Si un pinceau de décor est actif, on peint/efface en priorité sur cette case.
    const pinceau = this.decorSelectionne();
    if (pinceau) {
      const typeAPosed = pinceau === 'GOMME' ? null : pinceau;
      this.carteService.mjPeindreDecor(carte.id, c.q, c.r, typeAPosed);
      return;
    }

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

  /** Clic direct sur le pion : sélection pour déplacement, même si un pinceau est actif. */
  onClickPion(event: Event, nomPersonnage: string): void {
    event.stopPropagation();
    this.pionSelectionne.set(
      this.pionSelectionne() === nomPersonnage ? null : nomPersonnage
    );
  }

  choisirPinceau(decorId: string): void {
    this.decorSelectionne.set(this.decorSelectionne() === decorId ? null : decorId);
    this.pionSelectionne.set(null);
  }

  choisirGomme(): void {
    this.decorSelectionne.set(this.decorSelectionne() === 'GOMME' ? null : 'GOMME');
    this.pionSelectionne.set(null);
  }

  toggleModeMur(): void {
    this.modeMur.set(!this.modeMur());
    this.pionSelectionne.set(null);
  }

  /** Clic sur une poignée de bord : pose ou retire un mur sur ce côté. */
  onClickCote(event: Event, c: CaseAffichee, cote: number): void {
    event.stopPropagation();
    const carte = this.carteEditee();
    if (!carte || !this.modeMur()) return;
    this.carteService.mjToggleMur(carte.id, c.q, c.r, cote);
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