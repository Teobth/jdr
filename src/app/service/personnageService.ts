import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WS_BASE_URL } from '../constante';
import { toSignal } from '@angular/core/rxjs-interop';
import { ImageBuilderService } from './imageBuilderService';

export interface Secret {
  cle: string;
  valeur: string;
  debloque: boolean;
}

/** Une caractéristique principale (FOR, DEX, POU, etc.), avec sa valeur et ses dérivés éventuels. */
export interface Caracteristique {
  valeur: number;
  /** Pour MVT par exemple, un éventuel modificateur affiché (+1/-1). */
  modificateur?: string;
}

export interface Caracteristiques {
  FOR: number;
  DEX: number;
  POU: number;
  CON: number;
  APP: number;
  EDU: number;
  TAI: number;
  INT: number;
  MVT: number;
}

/** Une compétence de la fiche, avec son score de base et le score développé par le personnage. */
export interface Competence {
  nom: string;
  /** Score de base entre parenthèses sur la fiche papier, ex: 20 pour "Discrétion (20 %)". */
  base: number;
  /** Score actuel du personnage. */
  valeur: number;
}

export interface Arme {
  nom: string;
  ordinaire?: string;
  majeur?: string;
  extreme?: string;
  degats: string;
  portee: string;
  cadence: string;
  capacite: string;
  panne: string;
}

export interface Profil {
  description: string;
  ideologieCroyances: string;
  personnesImportantes: string;
  lieuxSignificatifs: string;
  biensPrecieux: string;
  traits: string;
  sequellesCicatrices: string;
  phobiesManies: string;
  ouvragesOccultes: string;
  rencontresEntites: string;
}

export interface Richesse {
  depensesCourantes: string;
  especes: string;
  capital: string;
}

export interface FicheCthulhu {
  occupation: string;
  residence: string;
  lieuNaissance: string;
  sexe: string;

  caracteristiques: Caracteristiques;

  pv: number;
  pvMax: number;
  blessureGrave: boolean;

  pm: number;
  pmMax: number;

  santeMentale: number;
  santeMentaleMax: number;
  santeMentaleInitiale: number;
  folieTemporaire: boolean;
  foliePersistante: boolean;

  chance: number;

  impact: string;
  carrure: number;
  esquive: number;

  competences: Competence[];
  armes: Arme[];
  equipement: string[];
  richesse: Richesse;
  profil: Profil;
}

export interface Personnage {
  nom: string;
  age: number;
  profession: string;
  rencontre: boolean;
  mort: boolean;
  portraitUrl: string;
  fullImageUrl: string;
  secrets: Secret[];
  /** Fiche complète façon "L'Appel de Cthulhu", optionnelle tant que le MJ ne l'a pas remplie. */
  fiche?: FicheCthulhu;
}

/** Champs nécessaires pour créer un personnage vierge. */
export interface NouveauPersonnage {
  nom: string;
  age?: number;
  profession?: string;
  portraitUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class PersonnageService {
  private imageBuilder = inject(ImageBuilderService);
  
  private personnagesDataSource: Personnage[] = [];
  private socket$: WebSocketSubject<any> | null = null;
  private personnagesSubject = new BehaviorSubject<Personnage[]>([]);

  personnages$ = this.personnagesSubject.asObservable();

  readonly personnagesRawSignal = toSignal(this.personnages$, { initialValue: [] as Personnage[] });

  readonly personnagesSignal = computed(() => {
    return this.personnagesRawSignal().map(p => ({
      ...p,
      fullImageUrl: this.imageBuilder.generateImageUrl(p.portraitUrl)
    }));
  });

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.socket$ = webSocket(WS_BASE_URL);
      this.socket$.subscribe({
        next: (message) => {
          let newPersonnagesData: Personnage[] | undefined;
          
          if (message.type === 'INITIAL_STATE') {
            newPersonnagesData = message.payload?.personnages;
          } else if (message.type === 'UPDATE_PERSONNAGES') {
            newPersonnagesData = message.payload;
          }

          if (newPersonnagesData) {
            this.personnagesDataSource = newPersonnagesData;
            this.personnagesSubject.next(this.personnagesDataSource);
          }
        }
      });
    }
  }

  getPersonnageParNom(nom: string): Personnage | undefined {
      console.log("Recherche de :", nom);
      console.log("Contenu actuel de personnagesDataSource :", this.personnagesDataSource);

      return this.personnagesDataSource.find(p => {
          if (!p || p.nom === undefined) {
              console.error("Objet mal formé détecté :", p);
              return false;
          }
          return p.nom.toLowerCase() === nom.toLowerCase();
      });
  }

  getPersonnagesRencontre(): Personnage[] {
    return this.personnagesDataSource.filter(p => p.rencontre);
  }

  toggleRencontre(p: Personnage): void {
    if (this.socket$) {
      this.socket$.next({ 
        type: 'TOGGLE_RENCONTRE_COMMAND',
        personnageNom: p.nom
      });
    } else {
        console.error("Tentative de toggleRencontre sans connexion WebSocket (Serveur ou non connecté).");
    }
  }

  toggleMort(p: Personnage): void {
    if (this.socket$) {
      this.socket$.next({ 
        type: 'TOGGLE_MORT_COMMAND',
        personnageNom: p.nom
      });
    } else {
        console.error("Tentative de toggleMort sans connexion WebSocket (Serveur ou non connecté).");
    }
  }
  
  toggleSecretDebloque(personnageNom: string, secretCle: string): void {
    if (this.socket$) {
      this.socket$.next({ 
        type: 'TOGGLE_SECRET_COMMAND',
        personnageNom: personnageNom,
        secretCle: secretCle
      });
    } else {
        console.error("Tentative de toggleSecret sans connexion WebSocket.");
    }
  }

  /** Le MJ envoie la fiche complète (ou un patch partiel) pour un personnage donné. */
  mettreAJourFiche(personnageNom: string, fiche: Partial<FicheCthulhu>): void {
    if (this.socket$) {
      this.socket$.next({
        type: 'UPDATE_FICHE_COMMAND',
        personnageNom,
        fiche
      });
    } else {
      console.error("Tentative de mise à jour de fiche sans connexion WebSocket.");
    }
  }

  /** Crée un nouveau personnage vierge (rencontre=false, mort=false, sans secrets). */
  creerPersonnage(champs: NouveauPersonnage): void {
    if (this.socket$) {
      this.socket$.next({
        type: 'MJ_CREER_PERSONNAGE_COMMAND',
        ...champs
      });
    } else {
      console.error("Tentative de création de personnage sans connexion WebSocket.");
    }
  }

  /** Supprime un personnage (et, côté serveur, ses liens et sa position sur le board). */
  supprimerPersonnage(nom: string): void {
    if (this.socket$) {
      this.socket$.next({
        type: 'MJ_SUPPRIMER_PERSONNAGE_COMMAND',
        nom
      });
    } else {
      console.error("Tentative de suppression de personnage sans connexion WebSocket.");
    }
  }
}

/**
 * Liste complète des ~50 compétences de la fiche officielle "L'Appel de Cthulhu" 7e édition,
 * avec leur score de base entre parenthèses sur la feuille papier.
 * Utile pour initialiser une fiche vierge côté admin.
 */
export const COMPETENCES_BASE: { nom: string; base: number }[] = [
  { nom: 'Anthropologie', base: 1 },
  { nom: 'Archéologie', base: 1 },
  { nom: 'Arts et métiers', base: 5 },
  { nom: 'Baratin', base: 5 },
  { nom: 'Bibliothèque', base: 20 },
  { nom: 'Charme', base: 15 },
  { nom: 'Combat à distance (armes de poing)', base: 20 },
  { nom: 'Combat à distance (fusils)', base: 25 },
  { nom: 'Combat rapproché (corps à corps)', base: 25 },
  { nom: 'Comptabilité', base: 5 },
  { nom: 'Conduite', base: 20 },
  { nom: 'Conduite engin lourd', base: 1 },
  { nom: 'Crédit', base: 0 },
  { nom: 'Crochetage', base: 1 },
  { nom: 'Discrétion', base: 20 },
  { nom: 'Droit', base: 5 },
  { nom: 'Écouter', base: 20 },
  { nom: 'Électricité', base: 10 },
  { nom: 'Équitation', base: 5 },
  { nom: 'Esquive', base: 0 }, // DEX/2, calculé séparément
  { nom: 'Estimation', base: 5 },
  { nom: 'Grimper', base: 20 },
  { nom: 'Histoire', base: 5 },
  { nom: 'Imposture', base: 5 },
  { nom: 'Intimidation', base: 15 },
  { nom: 'Lancer', base: 20 },
  { nom: 'Langue maternelle', base: 0 }, // ÉDU, calculé séparément
  { nom: 'Mécanique', base: 10 },
  { nom: 'Médecine', base: 1 },
  { nom: 'Mythe de Cthulhu', base: 0 },
  { nom: 'Nager', base: 20 },
  { nom: 'Naturalisme', base: 10 },
  { nom: 'Occultisme', base: 5 },
  { nom: 'Orientation', base: 10 },
  { nom: 'Persuasion', base: 10 },
  { nom: 'Pickpocket', base: 10 },
  { nom: 'Pilotage', base: 1 },
  { nom: 'Pister', base: 10 },
  { nom: 'Plongée', base: 1 },
  { nom: 'Premiers soins', base: 30 },
  { nom: 'Psychanalyse', base: 1 },
  { nom: 'Psychologie', base: 10 },
  { nom: 'Sauter', base: 20 },
  { nom: 'Sciences', base: 1 },
  { nom: 'Survie', base: 10 },
  { nom: 'Trouver Objet Caché', base: 25 }
];