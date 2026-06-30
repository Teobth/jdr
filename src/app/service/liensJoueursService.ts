import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { toSignal } from '@angular/core/rxjs-interop';
import { WS_BASE_URL } from '../constante';
import { TypeEntite, Lien } from './liensService';

/** Service du board joueurs partagé : même forme que LiensService (MJ), mais
 *  branché sur des commandes/événements WS distincts pour ne jamais mélanger
 *  les deux boards. */
@Injectable({ providedIn: 'root' })
export class LiensJoueursService {
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
            nouveauxLiens = message.payload?.liensJoueurs;
          } else if (message.type === 'UPDATE_LIENS_JOUEURS') {
            nouveauxLiens = message.payload;
          }

          if (nouveauxLiens) {
            this.liensSubject.next(nouveauxLiens);
          }
        },
        error: (err) => console.error('Erreur WebSocket (LiensJoueurs):', err),
      });
    }
  }

  liensDe(type: TypeEntite, id: string | number) {
    return computed(() => {
      return this.liensSignal().filter(l =>
        (l.sourceType === type && String(l.sourceId) === String(id)) ||
        (l.cibleType === type && String(l.cibleId) === String(id))
      );
    });
  }

  creerLien(sourceType: TypeEntite, sourceId: string | number, cibleType: TypeEntite, cibleId: string | number, note = ''): void {
    this.envoyer({ type: 'JOUEUR_CREER_LIEN_COMMAND', sourceType, sourceId, cibleType, cibleId, note });
  }

  modifierNote(lienId: number, note: string): void {
    this.envoyer({ type: 'JOUEUR_MODIFIER_NOTE_LIEN_COMMAND', lienId, note });
  }

  supprimerLien(lienId: number): void {
    this.envoyer({ type: 'JOUEUR_SUPPRIMER_LIEN_COMMAND', lienId });
  }

  private envoyer(payload: any): void {
    if (this.socket$) {
      this.socket$.next(payload);
    } else {
      console.error('Tentative d\'envoi sans connexion WebSocket (LiensJoueurs).');
    }
  }
}