import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { toSignal } from '@angular/core/rxjs-interop';
import { WS_BASE_URL } from '../constante';

export type StatutEtape = 'BLOQUÉ' | 'EN COURS' | 'COMPLÉTÉ';

export interface ScenarioStep {
  id: number;
  chapter: string;
  title: string;
  summary?: string;
  description: string;
  status: StatutEtape;
  /** Noms des personnages liés à cette étape (référence par nom, comme le reste de l'app). */
  personnagesLies?: string[];
  /** Ids des documents liés à cette étape. */
  documentsLies?: number[];
}

/** Champs nécessaires pour créer une étape. */
export interface NouvelleEtape {
  title: string;
  chapter: string;
  summary?: string;
  description?: string;
  status?: StatutEtape;
  personnagesLies?: string[];
  documentsLies?: number[];
}

/** Patch partiel applicable à une étape existante. */
export type PatchEtape = Partial<Omit<ScenarioStep, 'id'>>;

@Injectable({ providedIn: 'root' })
export class ScenarioService {
  private platformId = inject(PLATFORM_ID);
  private socket$: WebSocketSubject<any> | null = null;

  private scenarioSubject = new BehaviorSubject<ScenarioStep[]>([]);
  scenario$ = this.scenarioSubject.asObservable();

  readonly scenarioRawSignal = toSignal(this.scenario$, { initialValue: [] as ScenarioStep[] });

  /** Étapes normalisées : garantit toujours des tableaux pour les liens, même si absents du JSON. */
  readonly scenarioSignal = computed(() => {
    return this.scenarioRawSignal().map(s => ({
      ...s,
      personnagesLies: s.personnagesLies ?? [],
      documentsLies: s.documentsLies ?? []
    }));
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.socket$ = webSocket(WS_BASE_URL);
      this.socket$.subscribe({
        next: (message) => {
          let nouvellesEtapes: ScenarioStep[] | undefined;

          if (message.type === 'INITIAL_STATE') {
            nouvellesEtapes = message.payload?.scenario;
          } else if (message.type === 'UPDATE_SCENARIO') {
            nouvellesEtapes = message.payload;
          }

          if (nouvellesEtapes) {
            this.scenarioSubject.next(nouvellesEtapes);
          }
        },
        error: (err) => console.error('Erreur WebSocket (Scénario):', err),
      });
    }
  }

  updateStatus(stepId: number, newStatus: StatutEtape): void {
    this.envoyer({ type: 'UPDATE_STATUS_COMMAND', stepId, newStatus });
  }

  creerEtape(champs: NouvelleEtape): void {
    this.envoyer({ type: 'MJ_CREER_ETAPE_COMMAND', ...champs });
  }

  modifierEtape(stepId: number, champs: PatchEtape): void {
    this.envoyer({ type: 'MJ_MODIFIER_ETAPE_COMMAND', stepId, ...champs });
  }

  supprimerEtape(stepId: number): void {
    this.envoyer({ type: 'MJ_SUPPRIMER_ETAPE_COMMAND', stepId });
  }

  private envoyer(payload: any): void {
    if (this.socket$) {
      this.socket$.next(payload);
    } else {
      console.error('Tentative d\'envoi sans connexion WebSocket (Scénario).');
    }
  }
}