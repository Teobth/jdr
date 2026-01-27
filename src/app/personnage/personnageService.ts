import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WS_BASE_URL } from '../constante';

// --- INTERFACE ---
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
  portraitUrl: string;
  secrets: Secret[];
}

@Injectable({
  providedIn: 'root' 
})
export class PersonnageService {

  // --- PROPRIÉTÉS ---
  private personnagesDataSource: Personnage[] = [];

  private WS_URL = WS_BASE_URL; 
  
  private socket$: WebSocketSubject<any> | null = null;
  private personnagesSubject = new BehaviorSubject<Personnage[]>(this.personnagesDataSource);
  personnages$ = this.personnagesSubject.asObservable();
  
constructor(@Inject(PLATFORM_ID) private platformId: Object) { 
    
    if (isPlatformBrowser(this.platformId)) {
      
      console.log("Exécution côté client: Tentative de connexion WebSocket.");

      // 1. Initialisation du Socket UNIQUEMENT dans le navigateur
      this.socket$ = webSocket(this.WS_URL);

      // 2. Abonnement aux messages du serveur
      this.socket$.subscribe({
        next: (message) => {
          let newPersonnagesData: Personnage[] | undefined;

          // --- Traitement de l'état INITIAL ---
          if (message.type === 'INITIAL_STATE') {
              if (message.payload && message.payload.personnages) {
                  newPersonnagesData = message.payload.personnages;
              }
          } 
          
          // --- Traitement de la mise à jour spécifique ---
          else if (message.type === 'UPDATE_PERSONNAGES') {
              // Le payload est déjà le tableau (fonctionne comme avant)
              newPersonnagesData = message.payload;
          }
          
          // Mettre à jour l'état seulement si de nouvelles données ont été trouvées
          if (newPersonnagesData) {
              console.log(`Données de personnages reçues. Nombre: ${newPersonnagesData.length}`);
              this.personnagesDataSource = newPersonnagesData;
              this.personnagesSubject.next(this.personnagesDataSource);
          }
        },
        error: (err) => console.error('Erreur de connexion WebSocket:', err),
        complete: () => console.warn('Connexion WebSocket terminée.')
      });
      
    } else {
      console.warn("Exécution côté serveur (Node/SSR): La connexion WebSocket est ignorée.");
    }
  }

  // --- MÉTHODES D'ACCÈS CLASSIQUES (Aucun changement nécessaire) ---

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

  // --- MÉTHODE DE MUTATION ET NOTIFICATION ---
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