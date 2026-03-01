import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WS_BASE_URL } from '../constante';
import { toSignal } from '@angular/core/rxjs-interop';
import { ImageBuilderService } from './imageBuilderService';

export interface Doc {
  id: number;
  titre: string;
  contenu: string;
  accessible: boolean;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root' 
})
export class DocumentService {
  private imageBuilder = inject(ImageBuilderService)

  private documentsDataSource: Doc[] = [];
  private socket$: WebSocketSubject<any> | null = null
  private documentsSubject = new BehaviorSubject<Doc[]>([]);

  documents$ = this.documentsSubject.asObservable();

  readonly documentsRawSignal = toSignal(this.documents$, { initialValue: [] as Doc[]})

  readonly documentsSignal = computed(() => {
    return this.documentsRawSignal().map(d => ({
      ...d,
      fullImageUrl: this.imageBuilder.generateImageUrl(d.imageUrl)
    }));
  });

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.socket$ = webSocket(WS_BASE_URL);
      this.socket$.subscribe({
        next: (message) => {
          let newDocumentsData: Doc[] | undefined;

          if (message.type === 'INITIAL_STATE') {
            newDocumentsData = message.payload?.documents;
          } else if (message.type === 'UPDATE_DOCUMENTS') {
            newDocumentsData = message.payload;
          }

          if (newDocumentsData) {
            this.documentsDataSource = newDocumentsData;
            this.documentsSubject.next(this.documentsDataSource);
          }
        }
      });
    }
  }

  getDocumentParNom(nom: string): Doc | undefined {
    return this.documentsDataSource.find(d => d.titre.toLowerCase() === nom.toLowerCase());
  }

  getDocumentsAcces(): Doc[] {
    return this.documentsDataSource.filter(d => d.accessible);
  }

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