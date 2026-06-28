import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { toSignal } from '@angular/core/rxjs-interop';
import { WS_BASE_URL } from '../constante';

export type TypeEntite = 'personnage' | 'document';

export interface Lien {
  id: number;
  sourceType: TypeEntite;
  sourceId: string | number;
  cibleType: TypeEntite;
  cibleId: string | number;
  note: string;
}

@Injectable({ providedIn: 'root' })
export class LiensService {
  private platformId = inject(PLATFORM_ID);
  private socket$: WebSocketSubject<any> | null = null;

  private liensSubject = new BehaviorSubject<Lien[]>([]);
  liens$ = this.liensSubject.asObservable();

  readonly liensSignal = toSignal(this.liens$, { initialValue: [] as Lien[] });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.socket$ = webSocket(WS_BASE_URL);
      this.socket$.subscribe({
        next: (message) => {
          let nouveauxLiens: Lien[] | undefined;

          if (message.type === 'INITIAL_STATE') {
            nouveauxLiens = message.payload?.liens;
          } else if (message.type === 'UPDATE_LIENS') {
            nouveauxLiens = message.payload;
          }

          if (nouveauxLiens) {
            this.liensSubject.next(nouveauxLiens);
          }
        },
        error: (err) => console.error('Erreur WebSocket (Liens):', err),
      });
    }
  }

  /** Renvoie les liens impliquant une entité donnée (dans un sens ou l'autre). */
  liensDe(type: TypeEntite, id: string | number) {
    return computed(() => {
      return this.liensSignal().filter(l =>
        (l.sourceType === type && String(l.sourceId) === String(id)) ||
        (l.cibleType === type && String(l.cibleId) === String(id))
      );
    });
  }

  creerLien(sourceType: TypeEntite, sourceId: string | number, cibleType: TypeEntite, cibleId: string | number, note = ''): void {
    this.envoyer({ type: 'MJ_CREER_LIEN_COMMAND', sourceType, sourceId, cibleType, cibleId, note });
  }

  modifierNote(lienId: number, note: string): void {
    this.envoyer({ type: 'MJ_MODIFIER_NOTE_LIEN_COMMAND', lienId, note });
  }

  supprimerLien(lienId: number): void {
    this.envoyer({ type: 'MJ_SUPPRIMER_LIEN_COMMAND', lienId });
  }

  private envoyer(payload: any): void {
    if (this.socket$) {
      this.socket$.next(payload);
    } else {
      console.error('Tentative d\'envoi sans connexion WebSocket (Liens).');
    }
  }
}