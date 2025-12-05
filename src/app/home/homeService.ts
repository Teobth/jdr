import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Observable } from 'rxjs';
import { WS_BASE_URL } from '../constante';

@Injectable({ providedIn: 'root' })
export class HomeService {

  private readonly WS_URL = WS_BASE_URL
  private socket: WebSocketSubject<any>;
  private connectionStatus = new BehaviorSubject<boolean>(false);

  constructor() {
    this.socket = webSocket(this.WS_URL);
    this.socket.subscribe({
      next: (msg) => { /* Traitement normal */ },
      error: (err) => {
          console.error('Erreur ou fermeture de la socket. Tentative de reconnexion?', err);
          this.connectionStatus.next(false);
      },
      complete: () => {
          console.log('Socket fermée par le serveur. Tentative de reconnexion.');
          this.connectionStatus.next(false);
      }
      });  
  }

  // Envoi : utilisé par l'Admin pour diffuser le choix
  public sendDisplayChoice(payload: any): void {
    this.socket.next(payload);
  }

  // Réception : utilisé par l'écran public pour recevoir le changement
  public getDisplayUpdates(): Observable<any> {
    return this.socket.asObservable();
  }
}