import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WS_BASE_URL } from '../constante';
import { toSignal } from '@angular/core/rxjs-interop';

export interface Secret {
  cle: string;
  valeur: string;
  debloque: boolean;
}

export interface Personnage {
  nom: string;
  age: number;
  profession: string;
  rencontre: boolean;
  mort: boolean;
  portraitUrl: string;
  secrets: Secret[];
}

@Injectable({ providedIn: 'root' })
export class PersonnageService {
  private personnagesDataSource: Personnage[] = [];
  private socket$: WebSocketSubject<any> | null = null;
  private personnagesSubject = new BehaviorSubject<Personnage[]>([]);
  personnages$ = this.personnagesSubject.asObservable();
  readonly personnagesSignal = toSignal(this.personnages$, { initialValue: [] as Personnage[] });

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
}