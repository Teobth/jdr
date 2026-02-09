import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // <--- TRÈS IMPORTANT
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { WS_BASE_URL } from '../constante';

@Injectable({ providedIn: 'root' })
export class LieuService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private socket$: WebSocketSubject<any> | null = null;

  private readonly lastMessageSubject = new BehaviorSubject<any>(null);
  readonly lastMessage = toSignal(this.lastMessageSubject.asObservable(), { initialValue: null });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.connect();
    }
  }

  private connect(): void {
    this.socket$ = webSocket(WS_BASE_URL);
    
    this.socket$.subscribe({
      next: (msg) => this.lastMessageSubject.next(msg),
      error: (err) => console.error('Erreur WS:', err)
    });
  }

  public sendDisplayChoice(payload: any): void {
    if (this.socket$) {
      this.socket$.next(payload);
    }
  }

  ngOnDestroy(): void {
    this.socket$?.complete();
    this.lastMessageSubject.complete();
  }
}