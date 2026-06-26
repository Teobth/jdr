import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { WS_BASE_URL } from '../constante';

const SESSION_STORAGE_KEY = 'jdr_nomPersonnage';
const SESSION_STORAGE_ROLE_KEY = 'jdr_role';

export type Role = 'joueur' | 'mj';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private socket$: WebSocketSubject<any> | null = null;

  // Nom du personnage actuellement connecté (null si MJ ou déconnecté)
  readonly nomPersonnage = signal<string | null>(this.getStoredNom());

  // Rôle de la session actuelle ('joueur' ou 'mj'), null si déconnecté
  readonly role = signal<Role | null>(this.getStoredRole());

  // Message d'erreur affiché sur l'écran de connexion (ex: "PIN invalide")
  readonly erreurConnexion = signal<string | null>(null);

  // Indique si une tentative de connexion est en cours (en attente de réponse serveur)
  readonly enCoursDeConnexion = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.socket$ = webSocket(WS_BASE_URL);
      this.socket$.subscribe({
        next: (msg) => this.dispatchMessage(msg),
        error: (err) => console.error('Erreur WebSocket (Auth):', err),
      });
    }
  }

  private dispatchMessage(msg: any): void {
    if (msg.type === 'LOGIN_SUCCESS') {
      const nomPersonnage = msg.payload?.nomPersonnage ?? null;
      const role: Role = msg.payload?.role === 'mj' ? 'mj' : 'joueur';
      this.enregistrerConnexion(nomPersonnage, role);
    }
    if (msg.type === 'LOGIN_FAILED') {
      this.enCoursDeConnexion.set(false);
      this.erreurConnexion.set(msg.payload?.message ?? 'Code invalide');
    }
  }

  /**
   * Envoie le PIN saisi au serveur pour vérification.
   */
  seConnecter(pin: string): void {
    if (!this.socket$) {
      this.erreurConnexion.set('Connexion au serveur indisponible.');
      return;
    }
    this.erreurConnexion.set(null);
    this.enCoursDeConnexion.set(true);
    this.socket$.next({ type: 'LOGIN_COMMAND', pin });
  }

  private enregistrerConnexion(nomPersonnage: string | null, role: Role): void {
    this.enCoursDeConnexion.set(false);
    this.nomPersonnage.set(nomPersonnage);
    this.role.set(role);
    if (isPlatformBrowser(this.platformId)) {
      if (nomPersonnage) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, nomPersonnage);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
      sessionStorage.setItem(SESSION_STORAGE_ROLE_KEY, role);
    }
  }

  /**
   * Déconnecte l'utilisateur courant (efface la session locale).
   */
  seDeconnecter(): void {
    this.nomPersonnage.set(null);
    this.role.set(null);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_ROLE_KEY);
    }
  }

  estConnecte(): boolean {
    return this.role() !== null;
  }

  estMJ(): boolean {
    return this.role() === 'mj';
  }

  private getStoredNom(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem(SESSION_STORAGE_KEY);
    }
    return null;
  }

  private getStoredRole(): Role | null {
    if (isPlatformBrowser(this.platformId)) {
      const stored = sessionStorage.getItem(SESSION_STORAGE_ROLE_KEY);
      return stored === 'mj' || stored === 'joueur' ? stored : null;
    }
    return null;
  }
}