import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { toSignal } from '@angular/core/rxjs-interop';
import { WS_BASE_URL } from '../constante';
import { TypeEntiteBoard, PositionsBrutes } from './positionsService';

@Injectable({ providedIn: 'root' })
export class PositionsJoueursService {
  private platformId = inject(PLATFORM_ID);
  private socket$: WebSocketSubject<any> | null = null;

  private positionsSubject = new BehaviorSubject<PositionsBrutes>({});
  positions$ = this.positionsSubject.asObservable();

  readonly positionsSignal = toSignal(this.positions$, { initialValue: {} as PositionsBrutes });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.socket$ = webSocket(WS_BASE_URL);
      this.socket$.subscribe({
        next: (message) => {
          let nouvellesPositions: PositionsBrutes | undefined;

          if (message.type === 'INITIAL_STATE') {
            nouvellesPositions = message.payload?.positionsJoueurs;
          } else if (message.type === 'UPDATE_POSITIONS_JOUEURS') {
            nouvellesPositions = message.payload;
          }

          if (nouvellesPositions) {
            this.positionsSubject.next(nouvellesPositions);
          }
        },
        error: (err) => console.error('Erreur WebSocket (PositionsJoueurs):', err),
      });
    }
  }

  getPosition(type: TypeEntiteBoard, id: string | number): { x: number; y: number } | undefined {
    return this.positionsSignal()[`${type}:${id}`];
  }

  enregistrerPosition(type: TypeEntiteBoard, id: string | number, x: number, y: number): void {
    if (this.socket$) {
      this.socket$.next({
        type: 'JOUEUR_DEPLACER_CARTE_BOARD_COMMAND',
        entiteType: type,
        entiteId: id,
        x,
        y
      });
    } else {
      console.error("Tentative d'enregistrement de position joueur sans connexion WebSocket.");
    }
  }
}