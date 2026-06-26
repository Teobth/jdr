import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { toSignal } from '@angular/core/rxjs-interop';
import { WS_BASE_URL } from '../constante';

export interface Pion {
  nomPersonnage: string;
  q: number;
  r: number;
}

export interface Carte {
  id: number;
  nom: string;
  rayon: number;
  active: boolean;
  pions: Pion[];
}

/** Les 6 directions axiales d'une grille hexagonale (flat-top). */
const DIRECTIONS: { q: number; r: number }[] = [
  { q: 1, r: 0 },
  { q: -1, r: 0 },
  { q: 0, r: 1 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
  { q: -1, r: 1 }
];

@Injectable({ providedIn: 'root' })
export class CarteService {
  private platformId = inject(PLATFORM_ID);
  private socket$: WebSocketSubject<any> | null = null;

  private cartesSubject = new BehaviorSubject<Carte[]>([]);
  cartes$ = this.cartesSubject.asObservable();

  readonly cartesSignal = toSignal(this.cartes$, { initialValue: [] as Carte[] });

  /** La carte visible des joueurs (la seule marquée "active"). */
  readonly carteActive = computed(() => {
    return this.cartesSignal().find(c => c.active) ?? null;
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.socket$ = webSocket(WS_BASE_URL);
      this.socket$.subscribe({
        next: (message) => {
          let nouvellesCartes: Carte[] | undefined;

          if (message.type === 'INITIAL_STATE') {
            nouvellesCartes = message.payload?.cartes;
          } else if (message.type === 'UPDATE_CARTES') {
            nouvellesCartes = message.payload;
          }

          if (nouvellesCartes) {
            this.cartesSubject.next(nouvellesCartes);
          }
        },
        error: (err) => console.error('Erreur WebSocket (Carte):', err),
      });
    }
  }

  /** Renvoie les 6 cases voisines (axiales) d'une case donnée. */
  getVoisins(q: number, r: number): { q: number; r: number }[] {
    return DIRECTIONS.map(d => ({ q: q + d.q, r: r + d.r }));
  }

  /** Vérifie si deux cases sont adjacentes. */
  sontAdjacentes(q1: number, r1: number, q2: number, r2: number): boolean {
    return this.getVoisins(q1, r1).some(v => v.q === q2 && v.r === r2);
  }

  /** Vérifie si une case (q, r) est libre sur une carte donnée. */
  caseLibre(carte: Carte, q: number, r: number): boolean {
    return !carte.pions.some(p => p.q === q && p.r === r);
  }

  /** Vérifie qu'une case est dans les limites de la grille hexagonale de rayon donné. */
  estDansLaGrille(q: number, r: number, rayon: number): boolean {
    const s = -q - r;
    return Math.abs(q) <= rayon && Math.abs(r) <= rayon && Math.abs(s) <= rayon;
  }

  /**
   * Convertit des coordonnées axiales (q, r) en position pixel (x, y)
   * pour un hexagone "flat-top" (côtés plats en haut/bas), relative au centre (0,0).
   */
  axialVersPixel(q: number, r: number, tailleHex: number): { x: number; y: number } {
    const x = tailleHex * (3 / 2 * q);
    const y = tailleHex * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
    return { x, y };
  }

  /**
   * Calcule la taille totale du SVG et le décalage (offset) à appliquer à
   * axialVersPixel pour que toute la grille hexagonale de rayon donné soit
   * visible et centrée dans le viewBox, quelle que soit la taille de hexagone.
   */
  getDimensionsViewBox(rayon: number, tailleHex: number): { largeur: number; hauteur: number; offsetX: number; offsetY: number } {
    if (rayon <= 0) {
      const marge = tailleHex * 1.5;
      return { largeur: marge * 2, hauteur: marge * 2, offsetX: marge, offsetY: marge };
    }

    // Les coins les plus extrêmes d'une grille hexagonale flat-top de rayon R
    // sont atteints aux 6 sommets du grand hexagone : (R,0), (R,-R), (0,-R),
    // (-R,0), (-R,R), (0,R). On calcule leur position pixel pour englober
    // précisément la grille, puis on ajoute la moitié d'un hexagone de marge
    // pour que les bords des cases extrêmes ne soient pas coupés.
    const sommets = [
      { q: rayon, r: 0 }, { q: rayon, r: -rayon }, { q: 0, r: -rayon },
      { q: -rayon, r: 0 }, { q: -rayon, r: rayon }, { q: 0, r: rayon }
    ];

    const positions = sommets.map(s => this.axialVersPixel(s.q, s.r, tailleHex));
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);

    const marge = tailleHex; // marge de sécurité (rayon du cercle circonscrit d'un hex)
    const minX = Math.min(...xs) - marge;
    const maxX = Math.max(...xs) + marge;
    const minY = Math.min(...ys) - marge;
    const maxY = Math.max(...ys) + marge;

    return {
      largeur: maxX - minX,
      hauteur: maxY - minY,
      offsetX: -minX,
      offsetY: -minY
    };
  }

  /** Génère les 6 points du contour d'un hexagone flat-top centré sur (cx, cy). */
  pointsHexagone(cx: number, cy: number, tailleHex: number): string {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i);
      const x = cx + tailleHex * Math.cos(angle);
      const y = cy + tailleHex * Math.sin(angle);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return points.join(' ');
  }

  /** Génère toutes les cases (q, r) d'une grille hexagonale de rayon donné. */
  genererCasesGrille(rayon: number): { q: number; r: number }[] {
    const cases: { q: number; r: number }[] = [];
    for (let q = -rayon; q <= rayon; q++) {
      const rMin = Math.max(-rayon, -q - rayon);
      const rMax = Math.min(rayon, -q + rayon);
      for (let r = rMin; r <= rMax; r++) {
        cases.push({ q, r });
      }
    }
    return cases;
  }

  // --- Actions Joueur ---

  /** Déplace son propre pion vers une case adjacente (le serveur revalide tout). */
  deplacerMonPion(nomPersonnage: string, q: number, r: number): void {
    this.envoyer({ type: 'DEPLACER_PION_COMMAND', nomPersonnage, q, r });
  }

  // --- Actions MJ ---

  mjDeplacerPion(carteId: number, nomPersonnage: string, q: number, r: number): void {
    this.envoyer({ type: 'MJ_DEPLACER_PION_COMMAND', carteId, nomPersonnage, q, r });
  }

  mjAjouterPion(carteId: number, nomPersonnage: string, q = 0, r = 0): void {
    this.envoyer({ type: 'MJ_AJOUTER_PION_COMMAND', carteId, nomPersonnage, q, r });
  }

  mjRetirerPion(carteId: number, nomPersonnage: string): void {
    this.envoyer({ type: 'MJ_RETIRER_PION_COMMAND', carteId, nomPersonnage });
  }

  mjCreerCarte(nom: string, rayon: number): void {
    this.envoyer({ type: 'MJ_CREER_CARTE_COMMAND', nom, rayon });
  }

  mjActiverCarte(carteId: number): void {
    this.envoyer({ type: 'MJ_ACTIVER_CARTE_COMMAND', carteId });
  }

  mjSupprimerCarte(carteId: number): void {
    this.envoyer({ type: 'MJ_SUPPRIMER_CARTE_COMMAND', carteId });
  }

  private envoyer(payload: any): void {
    if (this.socket$) {
      this.socket$.next(payload);
    } else {
      console.error('Tentative d\'envoi sans connexion WebSocket (Carte).');
    }
  }
}