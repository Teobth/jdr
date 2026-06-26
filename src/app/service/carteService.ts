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

export interface Decor {
  q: number;
  r: number;
  type: string;
}

export interface Mur {
  q: number;
  r: number;
  /** Côté de l'hexagone (0 à 5), dans le même ordre que DIRECTIONS. */
  cote: number;
}

export interface Carte {
  id: number;
  nom: string;
  rayon: number;
  active: boolean;
  pions: Pion[];
  decors?: Decor[];
  murs?: Mur[];
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

  /** Indice du côté opposé (paires 0-1, 2-3, 4-5), cohérent avec DIRECTIONS. */
  private readonly OPPOSES = [1, 0, 3, 2, 5, 4];

  /** Renvoie l'indice de direction (0-5) de (q1,r1) vers son voisin (q2,r2), ou -1. */
  getDirectionVers(q1: number, r1: number, q2: number, r2: number): number {
    return this.getVoisins(q1, r1).findIndex(v => v.q === q2 && v.r === r2);
  }

  /**
   * Vérifie si un mur bloque le passage entre deux cases adjacentes, qu'il ait
   * été posé du côté de l'une ou de l'autre case (mur "miroir"). Logique
   * identique à celle du serveur, pour anticiper visuellement le blocage.
   */
  existeMurEntre(carte: Carte, q1: number, r1: number, q2: number, r2: number): boolean {
    const murs = carte.murs ?? [];
    const direction = this.getDirectionVers(q1, r1, q2, r2);
    if (direction === -1) return false;

    const directionOpposee = this.OPPOSES[direction];
    const murCoteA = murs.some(m => m.q === q1 && m.r === r1 && m.cote === direction);
    const murCoteB = murs.some(m => m.q === q2 && m.r === r2 && m.cote === directionOpposee);

    return murCoteA || murCoteB;
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

  /** Calcule un sommet (parmi les 6) du contour d'un hexagone flat-top centré sur (cx, cy). */
  private sommetHexagone(cx: number, cy: number, tailleHex: number, indice: number): { x: number; y: number } {
    const angle = (Math.PI / 180) * (60 * indice);
    return { x: cx + tailleHex * Math.cos(angle), y: cy + tailleHex * Math.sin(angle) };
  }

  /**
   * Pour chaque direction (0 à 5, dans l'ordre de DIRECTIONS), indique la paire
   * de sommets (indices 0-5 de pointsHexagone) qui forme le côté correspondant.
   */
  private readonly SOMMETS_PAR_COTE: [number, number][] = [
    [0, 1], // direction 0 : (q+1, r)
    [3, 4], // direction 1 : (q-1, r)
    [1, 2], // direction 2 : (q, r+1)
    [4, 5], // direction 3 : (q, r-1)
    [5, 0], // direction 4 : (q+1, r-1)
    [2, 3], // direction 5 : (q-1, r+1)
  ];

  /**
   * Calcule les deux points (x1,y1)-(x2,y2) du segment représentant le côté
   * `cote` (0-5) de l'hexagone situé en (cx, cy) [déjà en pixels, offset inclus].
   */
  segmentCote(cx: number, cy: number, tailleHex: number, cote: number): { x1: number; y1: number; x2: number; y2: number } {
    const [iA, iB] = this.SOMMETS_PAR_COTE[cote];
    const a = this.sommetHexagone(cx, cy, tailleHex, iA);
    const b = this.sommetHexagone(cx, cy, tailleHex, iB);
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  }

  /** Renvoie les 6 côtés (index 0-5) avec leur segment, pour affichage des poignées de pose de mur. */
  tousLesCotes(cx: number, cy: number, tailleHex: number): { cote: number; x1: number; y1: number; x2: number; y2: number; xMid: number; yMid: number }[] {
    return [0, 1, 2, 3, 4, 5].map(cote => {
      const seg = this.segmentCote(cx, cy, tailleHex, cote);
      return { cote, ...seg, xMid: (seg.x1 + seg.x2) / 2, yMid: (seg.y1 + seg.y2) / 2 };
    });
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

  /** Pose un décor sur une case (ou le retire si type est null). */
  mjPeindreDecor(carteId: number, q: number, r: number, decorType: string | null): void {
    this.envoyer({ type: 'MJ_PEINDRE_DECOR_COMMAND', carteId, q, r, decorType });
  }

  /** Bascule la présence d'un mur sur un côté donné (0-5) d'une case. */
  mjToggleMur(carteId: number, q: number, r: number, cote: number): void {
    this.envoyer({ type: 'MJ_TOGGLE_MUR_COMMAND', carteId, q, r, cote });
  }

  private envoyer(payload: any): void {
    if (this.socket$) {
      this.socket$.next(payload);
    } else {
      console.error('Tentative d\'envoi sans connexion WebSocket (Carte).');
    }
  }
}