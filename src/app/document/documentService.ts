import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WS_BASE_URL } from '../constante';

export interface Doc {
  id: string;
  titre: string;
  contenu: string;
  accessible: boolean;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root' 
})
export class DocumentService {

  // --- PROPRIÉTÉS ---
  private documentsDataSource: Doc[] = []; 
  private WS_URL = WS_BASE_URL; 
  private socket$: WebSocketSubject<any> | null = null;
  private documentsSubject = new BehaviorSubject<Doc[]>(this.documentsDataSource);
  documents$ = this.documentsSubject.asObservable();
  
constructor(@Inject(PLATFORM_ID) private platformId: Object) { 
    
    if (isPlatformBrowser(this.platformId)) {
      
      console.log("Exécution côté client: Tentative de connexion WebSocket.");

      this.socket$ = webSocket(this.WS_URL);

      this.socket$.subscribe({
        next: (message) => {
          let newDocumentsData: Doc[] | undefined;

          if (message.type === 'INITIAL_STATE') {
            if (message.payload && message.payload.documents) {
              newDocumentsData = message.payload.documents;
            }
          } 
          
          else if (message.type === 'UPDATE_DOCUMENTS') {
            newDocumentsData = message.payload; 
          }

          if (newDocumentsData) {
            console.log(`Données de documents reçues. Nombre: ${newDocumentsData.length}`);
            this.documentsDataSource = newDocumentsData; 
            this.documentsSubject.next(this.documentsDataSource);
          }
        },
        error: (err) => console.error('Erreur de connexion WebSocket:', err),
        complete: () => console.warn('Connexion WebSocket terminée.')
      });
      
    } else {
      console.warn("Exécution côté serveur (Node/SSR): La connexion WebSocket est ignorée.");
    }
  }

  getDocumentParNom(nom: string): Doc | undefined {
    return this.documentsDataSource.find(d => d.titre.toLowerCase() === nom.toLowerCase());
  }

  getDocumentsAcces(): Doc[] {
    return this.documentsDataSource.filter(d => d.accessible);
  }

  // --- MÉTHODE DE MUTATION ET NOTIFICATION ---
  toggleAcces(doc: Doc): void {
    if (this.socket$) {
      this.socket$.next({ 
        type: 'TOGGLE_ACCES_COMMAND',
        documentTitre: doc.titre
      });
    } else {
        console.error("Tentative de toggleRencontre sans connexion WebSocket (Serveur ou non connecté).");
    }
  }
}