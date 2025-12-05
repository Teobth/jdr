// src/app/admin/affiche-admin/affiche-admin.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../home/homeService'; // Votre service WebSocket

// 1. Importez votre fichier JSON ici (assurez-vous que le chemin est correct)
import * as displayOptions from '../../../assets/display-options.json'; 

// C'est votre interface
export interface Affiche {
  id: number;
  imageUrl: string; 
  description: string;
}

@Component({
  standalone: true,
  selector: 'app-admin-affiche',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './affiche-admin.html',
  styleUrls: ['../admin.css']
})
export class AfficheComponent implements OnInit { // Ajouté OnInit pour la bonne pratique
  
  // 2. Utilisez le JSON importé pour remplir les options de la liste déroulante
  public options: Affiche[] = (displayOptions as any).default || displayOptions; 
  
  // 3. Assurez-vous que selectedDisplayId correspond au type de votre ID (ici, j'utilise 'number')
  // Basé sur votre interface Affiche, l'ID est un nombre.
  public selectedDisplayId: number | undefined = this.options[0]?.id; 

  // 4. Injection du service : utilisez HomeService et une variable cohérente (homeService)
  constructor(private homeService: HomeService) { } 

  ngOnInit(): void {
    // Si nécessaire, vous pouvez initialiser ici l'ID sélectionné 
  }

  /**
   * Envoie le choix de l'affichage via le service WebSocket
   */
  public onDisplayChange(): void {
    if (this.selectedDisplayId === undefined) {
      console.warn("Aucun ID sélectionné.");
      return;
    }
    
    const payload = { 
      type: 'UPDATE_DISPLAY_ID_COMMAND',
      displayId: this.selectedDisplayId
    };
    
    this.homeService.sendDisplayChoice(payload);
    
    console.log('Choix envoyé:', payload);
  }
}