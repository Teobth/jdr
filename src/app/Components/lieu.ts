import { Component, inject, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { LieuService } from '../service/lieuService'; 
import * as displayOptions from '../ws-server/contenuJson/lieu.json';

@Component({
  standalone: true, 
  selector: 'app-home',
  templateUrl: '../html/lieu.html', 
  styleUrls: ['../css/lieu.css'],
  imports: [RouterModule, FormsModule]
})

export class LieuComponent {
  private lieuService = inject(LieuService);

  readonly listeOptions = (displayOptions as any).default || displayOptions;

  // IMPORTANT : On utilise directement le signal déjà exposé par le service
  // Ne pas refaire un toSignal() ici si le service le propose déjà.
  private displayUpdate = this.lieuService.lastMessage;

  readonly detailsAffiche = computed(() => {
    const message = this.displayUpdate(); // Appel du signal
    
    if (!message) return undefined;

    let id: number | undefined;

    // Normalisation selon la structure de vos messages WebSocket
    if (message.type === 'UPDATE_DISPLAY_ID') {
      id = message.displayId;
    } else if (message.type === 'INITIAL_STATE') {
      id = message.payload?.displayId;
    }

    return id !== undefined 
      ? this.listeOptions.find((a: any) => a.id === id) 
      : undefined;
  });
}