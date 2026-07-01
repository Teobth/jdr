import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { PersonnageService, Personnage } from '../service/personnageService';
import { DocumentService, Doc } from '../service/documentService';
import { LiensJoueursService, } from '../service/liensJoueursService';
import { PositionsJoueursService } from '../service/positionsJoueursService';
import { TypeEntite } from '../service/liensService';

interface CarteBoardJoueur {
  type: TypeEntite;
  id: string | number;
  titre: string;
  sousTitre: string;
  imageUrl: string;
  grise: boolean;
  x: number;
  y: number;
}

const LARGEUR_CARTE = 140;
const HAUTEUR_CARTE = 170;
const MARGE = 24;

@Component({
  standalone: true,
  selector: 'app-carte-board',
  imports: [CommonModule, DragDropModule],
  templateUrl: '../html/board.html',
  styleUrls: ['../css/admin-board.css', '../css/admin-board.css']
})
export class CarteBoardComponent {
  private personnageService = inject(PersonnageService);
  private documentService = inject(DocumentService);
  private liensJoueursService = inject(LiensJoueursService);
  private positionsJoueursService = inject(PositionsJoueursService);

  @ViewChild('boardZone') boardZoneRef!: ElementRef<HTMLDivElement>;

  private largeurBoard = signal(900);

  // Seules les entités déjà révélées aux joueurs apparaissent ici.
  readonly cartesPersonnages = computed<CarteBoardJoueur[]>(() => {
    return this.personnageService.personnagesSignal()
      .filter(p => p.rencontre)
      .map((p, index) => this.construireCarte('personnage', p.nom, p, index));
  });

  readonly cartesDocuments = computed<CarteBoardJoueur[]>(() => {
    const decalage = this.cartesPersonnages().length;
    return this.documentService.documentsSignal()
      .filter(d => d.accessible)
      .map((d, index) => this.construireCarte('document', d.id, d, decalage + index));
  });

  readonly toutesLesCartes = computed<CarteBoardJoueur[]>(() => [
    ...this.cartesPersonnages(),
    ...this.cartesDocuments()
  ]);

  private construireCarte(type: TypeEntite, id: string | number, source: any, indexGlobal: number): CarteBoardJoueur {
    const positionSauvee = this.positionsJoueursService.getPosition(type, id);
    const colonnes = Math.max(1, Math.floor(this.largeurBoard() / (LARGEUR_CARTE + MARGE)));
    const rangementAuto = {
      x: MARGE + (indexGlobal % colonnes) * (LARGEUR_CARTE + MARGE),
      y: MARGE + Math.floor(indexGlobal / colonnes) * (HAUTEUR_CARTE + MARGE)
    };

    if (type === 'personnage') {
      const p = source as Personnage;
      return {
        type, id, titre: p.nom, sousTitre: p.profession,
        imageUrl: (p as any).fullImageUrl, grise: p.mort,
        x: positionSauvee?.x ?? rangementAuto.x,
        y: positionSauvee?.y ?? rangementAuto.y
      };
    } else {
      const d = source as Doc;
      return {
        type, id, titre: d.titre, sousTitre: 'Document',
        imageUrl: (d as any).fullImageUrl, grise: !d.accessible,
        x: positionSauvee?.x ?? rangementAuto.x,
        y: positionSauvee?.y ?? rangementAuto.y
      };
    }
  }

  private cle(type: TypeEntite, id: string | number): string {
    return `${type}:${id}`;
  }

  // --- Déplacement ---

  readonly positionTemporaire = signal<{ cle: string; x: number; y: number } | null>(null);

  onDragMoved(carte: CarteBoardJoueur, event: { distance: { x: number; y: number } }): void {
    this.positionTemporaire.set({
      cle: this.cle(carte.type, carte.id),
      x: carte.x + event.distance.x,
      y: carte.y + event.distance.y
    });
  }

  onDragEnded(carte: CarteBoardJoueur, event: CdkDragEnd): void {
    const nouvelleX = carte.x + event.distance.x;
    const nouvelleY = carte.y + event.distance.y;

    this.positionsJoueursService.enregistrerPosition(carte.type, carte.id, nouvelleX, nouvelleY);

    event.source.reset();
    this.positionTemporaire.set(null);
  }

  positionAffichee(carte: CarteBoardJoueur): { x: number; y: number } {
    const temp = this.positionTemporaire();
    if (temp && temp.cle === this.cle(carte.type, carte.id)) {
      return { x: temp.x, y: temp.y };
    }
    return { x: carte.x, y: carte.y };
  }

  // --- Sélection / liaison ---

  readonly carteSelectionneeCle = signal<string | null>(null);

  readonly carteSelectionnee = computed<CarteBoardJoueur | null>(() => {
    const cle = this.carteSelectionneeCle();
    if (!cle) return null;
    return this.toutesLesCartes().find(c => this.cle(c.type, c.id) === cle) ?? null;
  });

  readonly carteEnAttenteDeLien = signal<CarteBoardJoueur | null>(null);

  readonly carteEnAttenteCle = computed(() => {
    const c = this.carteEnAttenteDeLien();
    return c ? this.cle(c.type, c.id) : null;
  });

  cliquerCarte(carte: CarteBoardJoueur): void {
    const enAttente = this.carteEnAttenteDeLien();

    if (enAttente) {
      const memeCarte = enAttente.type === carte.type && String(enAttente.id) === String(carte.id);
      if (!memeCarte) {
        this.liensJoueursService.creerLien(enAttente.type, enAttente.id, carte.type, carte.id);
      }
      this.carteEnAttenteDeLien.set(null);
      return;
    }

    this.carteSelectionneeCle.set(this.cle(carte.type, carte.id));
  }

  demarrerLien(carte: CarteBoardJoueur, event: Event): void {
    event.stopPropagation();
    this.carteEnAttenteDeLien.set(carte);
  }

  annulerLien(): void {
    this.carteEnAttenteDeLien.set(null);
  }

  fermerPanneau(): void {
    this.carteSelectionneeCle.set(null);
  }

  // --- Connexions affichées ---

  readonly connexionsAffichees = computed(() => {
    const cartesParCle = new Map(this.toutesLesCartes().map(c => [this.cle(c.type, c.id), c]));

    return this.liensJoueursService.liensSignal()
      .map(lien => {
        const source = cartesParCle.get(this.cle(lien.sourceType, lien.sourceId));
        const cible = cartesParCle.get(this.cle(lien.cibleType, lien.cibleId));
        if (!source || !cible) return null;

        const posSource = this.positionAffichee(source);
        const posCible = this.positionAffichee(cible);

        return {
          lien,
          x1: posSource.x + LARGEUR_CARTE / 2,
          y1: posSource.y + HAUTEUR_CARTE / 2,
          x2: posCible.x + LARGEUR_CARTE / 2,
          y2: posCible.y + HAUTEUR_CARTE / 2
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  });

  readonly hauteurBoard = computed(() => {
    const cartes = this.toutesLesCartes();
    if (cartes.length === 0) return 400;
    const maxY = Math.max(...cartes.map(c => this.positionAffichee(c).y));
    return maxY + HAUTEUR_CARTE + MARGE * 2;
  });

  // --- Liens de la sélection ---

  readonly liensDeLaSelection = computed(() => {
    const carte = this.carteSelectionnee();
    if (!carte) return [];

    const cartesParCle = new Map(this.toutesLesCartes().map(c => [this.cle(c.type, c.id), c]));

    return this.liensJoueursService.liensSignal()
      .filter(l =>
        (l.sourceType === carte.type && String(l.sourceId) === String(carte.id)) ||
        (l.cibleType === carte.type && String(l.cibleId) === String(carte.id))
      )
      .map(lien => {
        const estSource = lien.sourceType === carte.type && String(lien.sourceId) === String(carte.id);
        const autreCle = estSource ? this.cle(lien.cibleType, lien.cibleId) : this.cle(lien.sourceType, lien.sourceId);
        return { lien, autreCarte: cartesParCle.get(autreCle) ?? null };
      })
      .filter(l => l.autreCarte !== null);
  });

  modifierNoteLien(lienId: number, note: string): void {
    this.liensJoueursService.modifierNote(lienId, note);
  }

  supprimerLien(lienId: number): void {
    this.liensJoueursService.supprimerLien(lienId);
  }
}