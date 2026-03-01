import { Injectable, inject, PLATFORM_ID, OnDestroy, signal } from '@angular/core'; // <--- AJOUT signal
import { isPlatformBrowser } from '@angular/common';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { WS_BASE_URL } from '../constante';

export interface Lieu {
  id: number;
  nom?: string;
  imageUrl?: string;
  description?: { balise: string; contenu: string }[];
}

@Injectable({ providedIn: 'root' })
export class LieuService implements OnDestroy {  
  private platformId = inject(PLATFORM_ID);
  private socket$: WebSocketSubject<any> | null = null;
  
  // 1. On stocke les données brutes du serveur ici
  readonly donneesServeur = signal<any>(null);

  private lieuActuelSubject = new BehaviorSubject<Lieu | null>(null);
  readonly lieuActuel = toSignal(this.lieuActuelSubject.asObservable(), { initialValue: null });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.socket$ = webSocket(WS_BASE_URL);
      this.socket$.subscribe({
        next: (msg) => this.dispatchMessage(msg),
        error: (err) => console.error('Erreur WebSocket:', err),
      });
    }
  }

  private dispatchMessage(msg: any): void {
    if (msg.type === 'INITIAL_STATE') {
      this.donneesServeur.set(msg.payload);
      this.lieuActuelSubject.next({
        id: Number(msg.payload.displayId)
      });
    }
    if (msg.type === 'UPDATE_DISPLAY_ID') {
      const newId = msg.payload?.displayId;
      if (newId !== undefined) {
        this.lieuActuelSubject.next({ id: Number(newId) });
      }
    }
  }

  public sendDisplayChoice(payload: any): void {
    if (this.socket$) this.socket$.next(payload);
  }

  ngOnDestroy(): void {
    this.socket$?.complete();
  }
}