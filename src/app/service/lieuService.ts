import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WS_BASE_URL } from '../constante';

export interface Lieu { id: number; nom: string; imageUrl?: string; [key: string]: any; }

@Injectable({ providedIn: 'root' })
export class LieuService {
  private platformId = inject(PLATFORM_ID);
  private socket$: WebSocketSubject<any> | null = null;

  // Signal pour la liste complète des données
  readonly donneesServeur = signal<any>({ affiches: [] });
  // Signal pour le lieu actuellement sélectionné
  readonly lieuActuel = signal<Lieu | null>(null);

  readonly optionsSignal = computed(() => this.donneesServeur().affiches);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.socket$ = webSocket(WS_BASE_URL);
      this.socket$.subscribe({
        next: (message) => {
          if (message.type === 'INITIAL_STATE') {
            // Supposons que le serveur envoie tout le payload ici
            this.donneesServeur.set(message.payload);
          } else if (message.type === 'UPDATE_DISPLAY_ID') {
            // Si le serveur notifie un changement de lieu actif
            const id = message.displayId;
            const trouve = this.donneesServeur().affiches?.find((a: any) => Number(a.id) === Number(id));
            if (trouve) this.lieuActuel.set(trouve);
          }
        }
      });
    }
  }

  sendDisplayChoice(payload: any): void {
    this.socket$?.next(payload);
  }
}