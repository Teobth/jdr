import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { PersonnageService, Personnage } from '../service/personnageService';
import { DocumentService, Doc } from '../service/documentService';
import { LiensService, Lien, TypeEntite } from '../service/liensService';
import { PositionsService } from '../service/positionsService';

/** Carte affichée sur le board, qu'elle représente un personnage ou un document. */
interface CarteBoard {
  type: TypeEntite;
  id: string | number;
  titre: string;
  sousTitre: string;
  imageUrl: string;
  grise: boolean; // mort (personnage) ou non-accessible (document) -> affichage atténué
  /** Uniquement pertinent pour les personnages ; undefined pour les documents. */
  rencontre?: boolean;
  x: number;
  y: number;
}

const LARGEUR_CARTE = 140;
const HAUTEUR_CARTE = 170;
const MARGE = 24;

@Component({
  standalone: true,
  selector: 'app-admin-board',
  imports: [CommonModule, FormsModule, DragDropModule, RouterLink],
  templateUrl: '../html/admin-board.html',
  styleUrls: ['../css/admin.css', '../css/admin-board.css']
})
export class AdminBoardComponent {
  private personnageService = inject(PersonnageService);
  private documentService = inject(DocumentService);
  private liensService = inject(LiensService);
  private positionsService = inject(PositionsService);

  @ViewChild('boardZone') boardZoneRef!: ElementRef<HTMLDivElement>;

  /** Largeur disponible du board, utilisée pour le rangement automatique des cartes jamais déplacées. */
  private largeurBoard = signal(900);

  readonly cartesPersonnages = computed<CarteBoard[]>(() => {
    return this.personnageService.personnagesSignal().map((p, index) =>
      this.construireCarte('personnage', p.nom, p, index)
    );
  });

  readonly cartesDocuments = computed<CarteBoard[]>(() => {
    const decalage = this.cartesPersonnages().length;
    return this.documentService.documentsSignal().map((d, index) =>
      this.construireCarte('document', d.id, d, decalage + index)
    );
  });

  readonly toutesLesCartes = computed<CarteBoard[]>(() => [
    ...this.cartesPersonnages(),
    ...this.cartesDocuments()
  ]);

  private construireCarte(type: TypeEntite, id: string | number, source: any, indexGlobal: number): CarteBoard {
    // Position persistée côté serveur en priorité ; sinon rangement automatique en grille.
    const positionSauvee = this.positionsService.getPosition(type, id);
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
        rencontre: p.rencontre,
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

  // --- Déplacement (CDK drag&drop en mode libre, persisté côté serveur) ---

  /** Position en cours de glissement, utilisée uniquement pour redessiner les fils en direct. */
  readonly positionTemporaire = signal<{ cle: string; x: number; y: number } | null>(null);

  onDragMoved(carte: CarteBoard, event: { distance: { x: number; y: number } }): void {
    this.positionTemporaire.set({
      cle: this.cle(carte.type, carte.id),
      x: carte.x + event.distance.x,
      y: carte.y + event.distance.y
    });
  }

  onDragEnded(carte: CarteBoard, event: CdkDragEnd): void {
    const nouvelleX = carte.x + event.distance.x;
    const nouvelleY = carte.y + event.distance.y;

    // Persistance immédiate côté serveur ; le rendu se remet à jour via le signal positionsSignal.
    this.positionsService.enregistrerPosition(carte.type, carte.id, nouvelleX, nouvelleY);

    event.source.reset();
    this.positionTemporaire.set(null);
  }

  positionAffichee(carte: CarteBoard): { x: number; y: number } {
    const temp = this.positionTemporaire();
    if (temp && temp.cle === this.cle(carte.type, carte.id)) {
      return { x: temp.x, y: temp.y };
    }
    return { x: carte.x, y: carte.y };
  }

  // --- Sélection et mode "création de lien" ---

  readonly carteSelectionneeCle = signal<string | null>(null);

  readonly carteSelectionnee = computed<CarteBoard | null>(() => {
    const cle = this.carteSelectionneeCle();
    if (!cle) return null;
    return this.toutesLesCartes().find(c => this.cle(c.type, c.id) === cle) ?? null;
  });

  /** Carte source en attente d'une cible pour créer un lien (activé par la poignée "lier"). */
  readonly carteEnAttenteDeLien = signal<CarteBoard | null>(null);

  /** Clé ("type:id") de la carte en attente, pour comparaison stable dans le template. */
  readonly carteEnAttenteCle = computed(() => {
    const c = this.carteEnAttenteDeLien();
    return c ? this.cle(c.type, c.id) : null;
  });

  cliquerCarte(carte: CarteBoard): void {
    const enAttente = this.carteEnAttenteDeLien();

    if (enAttente) {
      const memeCarte = enAttente.type === carte.type && String(enAttente.id) === String(carte.id);
      if (!memeCarte) {
        this.liensService.creerLien(enAttente.type, enAttente.id, carte.type, carte.id);
      }
      this.carteEnAttenteDeLien.set(null);
      return;
    }

    this.modeFormulaireCreation.set(null);
    this.carteSelectionneeCle.set(this.cle(carte.type, carte.id));
  }

  demarrerLien(carte: CarteBoard, event: Event): void {
    event.stopPropagation();
    this.carteEnAttenteDeLien.set(carte);
  }

  annulerLien(): void {
    this.carteEnAttenteDeLien.set(null);
  }

  fermerPanneau(): void {
    this.carteSelectionneeCle.set(null);
    this.modeFormulaireCreation.set(null);
  }

  // --- Connexions affichées sur le board (lignes SVG) ---

  readonly connexionsAffichees = computed(() => {
    const cartesParCle = new Map(this.toutesLesCartes().map(c => [this.cle(c.type, c.id), c]));

    return this.liensService.liensSignal()
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

  // --- Liens de la carte sélectionnée, pour le panneau ---

  readonly liensDeLaSelection = computed(() => {
    const carte = this.carteSelectionnee();
    if (!carte) return [];

    const cartesParCle = new Map(this.toutesLesCartes().map(c => [this.cle(c.type, c.id), c]));

    return this.liensService.liensSignal()
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
    this.liensService.modifierNote(lienId, note);
  }

  supprimerLien(lienId: number): void {
    this.liensService.supprimerLien(lienId);
  }

  // --- Actions personnage / document (panneau détail) ---

  toggleRencontre(carte: CarteBoard): void {
    const p = this.personnageService.personnagesSignal().find(pp => pp.nom === carte.id);
    if (p) this.personnageService.toggleRencontre(p);
  }

  toggleMort(carte: CarteBoard): void {
    const p = this.personnageService.personnagesSignal().find(pp => pp.nom === carte.id);
    if (p) this.personnageService.toggleMort(p);
  }

  toggleSecret(carte: CarteBoard, secretCle: string): void {
    this.personnageService.toggleSecretDebloque(String(carte.id), secretCle);
  }

  toggleAccesDocument(carte: CarteBoard): void {
    const d = this.documentService.documentsSignal().find(dd => dd.id === carte.id);
    if (d) this.documentService.toggleAcces(d);
  }

  getPersonnageDetail(carte: CarteBoard): Personnage | undefined {
    return this.personnageService.personnagesSignal().find(p => p.nom === carte.id);
  }

  getDocumentDetail(carte: CarteBoard): Doc | undefined {
    return this.documentService.documentsSignal().find(d => d.id === carte.id);
  }

  supprimerCarte(carte: CarteBoard): void {
    if (carte.type === 'personnage') {
      this.personnageService.supprimerPersonnage(String(carte.id));
    } else {
      this.documentService.supprimerDocument(carte.id as number);
    }
    this.fermerPanneau();
  }

  /** Met à jour le chemin d'image d'une carte existante (personnage ou document), depuis le panneau détail. */
  modifierImageCarte(carte: CarteBoard, nouveauChemin: string): void {
    const chemin = nouveauChemin.trim();
    if (carte.type === 'personnage') {
      this.personnageService.modifierPortrait(String(carte.id), chemin);
    } else {
      this.documentService.modifierImage(carte.id as number, chemin);
    }
  }

  // --- Création de personnage / document depuis le board ---

  /** Quel formulaire de création afficher dans le panneau ('personnage' | 'document' | null). */
  readonly modeFormulaireCreation = signal<'personnage' | 'document' | null>(null);

  readonly nouveauPersonnageNom = signal('');
  readonly nouveauPersonnageAge = signal<number | null>(null);
  readonly nouveauPersonnageProfession = signal('');
  readonly nouveauPersonnagePortraitUrl = signal('');

  readonly nouveauDocumentTitre = signal('');
  readonly nouveauDocumentContenu = signal('');
  readonly nouveauDocumentImageUrl = signal('');

  ouvrirCreationPersonnage(): void {
    this.carteSelectionneeCle.set(null);
    this.nouveauPersonnageNom.set('');
    this.nouveauPersonnageAge.set(null);
    this.nouveauPersonnageProfession.set('');
    this.nouveauPersonnagePortraitUrl.set('');
    this.modeFormulaireCreation.set('personnage');
  }

  ouvrirCreationDocument(): void {
    this.carteSelectionneeCle.set(null);
    this.nouveauDocumentTitre.set('');
    this.nouveauDocumentContenu.set('');
    this.nouveauDocumentImageUrl.set('');
    this.modeFormulaireCreation.set('document');
  }

  annulerCreation(): void {
    this.modeFormulaireCreation.set(null);
  }

  validerCreationPersonnage(): void {
    const nom = this.nouveauPersonnageNom().trim();
    if (!nom) return;

    this.personnageService.creerPersonnage({
      nom,
      age: this.nouveauPersonnageAge() ?? undefined,
      profession: this.nouveauPersonnageProfession().trim(),
      portraitUrl: this.nouveauPersonnagePortraitUrl().trim()
    });

    this.modeFormulaireCreation.set(null);
  }

  validerCreationDocument(): void {
    const titre = this.nouveauDocumentTitre().trim();
    if (!titre) return;

    this.documentService.creerDocument({
      titre,
      contenu: this.nouveauDocumentContenu().trim(),
      imageUrl: this.nouveauDocumentImageUrl().trim()
    });

    this.modeFormulaireCreation.set(null);
  }
}