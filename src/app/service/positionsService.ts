import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { toSignal } from '@angular/core/rxjs-interop';
import { WS_BASE_URL } from '../constante';

export type TypeEntiteBoard = 'personnage' | 'document';

/** Format brut tel que stocké côté serveur : { "personnage:Nom": {x,y}, "document:3": {x,y} } */
export type PositionsBrutes = Record<string, { x: number; y: number }>;

@Injectable({ providedIn: 'root' })
export class PositionsService {
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
            nouvellesPositions = message.payload?.positions;
          } else if (message.type === 'UPDATE_POSITIONS') {
            nouvellesPositions = message.payload;
          }

          if (nouvellesPositions) {
            this.positionsSubject.next(nouvellesPositions);
          }
        },
        error: (err) => console.error('Erreur WebSocket (Positions):', err),
      });
    }
  }

  /** Renvoie la position connue d'une entité, ou undefined si jamais déplacée. */
  getPosition(type: TypeEntiteBoard, id: string | number): { x: number; y: number } | undefined {
    return this.positionsSignal()[`${type}:${id}`];
  }

  /** Sauvegarde la nouvelle position d'une carte après un déplacement sur le board. */
  enregistrerPosition(type: TypeEntiteBoard, id: string | number, x: number, y: number): void {
    if (this.socket$) {
      this.socket$.next({
        type: 'MJ_DEPLACER_CARTE_BOARD_COMMAND',
        entiteType: type,
        entiteId: id,
        x,
        y
      });
    } else {
      console.error("Tentative d'enregistrement de position sans connexion WebSocket.");
    }
  }
}