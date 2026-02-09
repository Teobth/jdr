import { Component, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LieuService } from '../service/LieuService';
import * as displayOptionsData from "../ws-server/contenuJson/display-options.json";
import { isPlatformBrowser } from '@angular/common';

const SESSION_STORAGE_KEY = 'selectedDisplayId';

@Component({
  standalone: true,
  selector: 'app-admin-affiche',
  imports: [RouterModule, FormsModule],
  templateUrl: '../html/admin-affiche.html',
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

  getInitialId() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = sessionStorage.getItem('votre_cle');
      return stored ? parseInt(stored, 10) : undefined;
    }
    return undefined;
  }
}