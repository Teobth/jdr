import { Component, inject, signal, effect, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LieuService } from '../service/lieuService';
import * as displayOptionsData from "../ws-server/contenuJson/lieu.json";
import { isPlatformBrowser } from '@angular/common';

const SESSION_STORAGE_KEY = 'selectedDisplayId';

@Component({
  standalone: true,
  selector: 'app-admin-affiche',
  imports: [RouterModule, FormsModule],
  templateUrl: '../html/admin-affiche.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['../css/admin.css']
})
export class AfficheComponent {
  private platformId = inject(PLATFORM_ID);
  private lieuService = inject(LieuService);
  readonly options = signal<any[]>((displayOptionsData as any).default || displayOptionsData);

  readonly selectedDisplayId = signal<number | undefined>(this.getInitialId());

  constructor() {
    effect(() => {
      const id = this.selectedDisplayId();
      if (id !== undefined) {
        this.saveAndSend(id);
      }
    });
  }

  private saveAndSend(id: number): void {
    sessionStorage.setItem(SESSION_STORAGE_KEY, id.toString());
    
    const payload = { 
      type: 'UPDATE_DISPLAY_ID_COMMAND',
      displayId: id
    };
    this.lieuService.sendDisplayChoice(payload);
  }

  onDisplayChange(newId: number): void {
    this.selectedDisplayId.set(newId);
  }

  getInitialId(): number | undefined {
    if (isPlatformBrowser(this.platformId)) {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY); // Utilise la même clé !
      return stored ? parseInt(stored, 10) : undefined;
    }
    return undefined;
  }
}