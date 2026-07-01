import { Component, inject, signal, effect, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LieuService } from '../service/lieuService';
import { isPlatformBrowser } from '@angular/common';

const SESSION_STORAGE_KEY = 'selectedDisplayId';

@Component({
  standalone: true,
  selector: 'app-admin-affiche',
  imports: [RouterModule, FormsModule],
  templateUrl: '../html/admin-affiche.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../css/admin.css']
})
export class AfficheComponent {
  private platformId = inject(PLATFORM_ID);
  private lieuService = inject(LieuService);

  // On utilise le signal provenant du service (réactif et dynamique)
  readonly options = this.lieuService.optionsSignal;

  readonly selectedDisplayId = signal<number | undefined>(this.getInitialId());

  constructor() {
    effect(() => {
      console.log('Options reçues dans AfficheComponent :', this.options());
    });
  }

  onDisplayChange(newId: number | undefined): void {
    if (newId === undefined) return; // Sécurité
    this.selectedDisplayId.set(newId);
    this.saveAndSend(newId);
  }

  private saveAndSend(id: number): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, id.toString());
    }
    
    const payload = { 
      type: 'UPDATE_DISPLAY_ID_COMMAND',
      displayId: id
    };
    this.lieuService.sendDisplayChoice(payload);
  }

  getInitialId(): number | undefined {
    if (isPlatformBrowser(this.platformId)) {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? parseInt(stored, 10) : undefined;
    }
    return undefined;
  }
}
