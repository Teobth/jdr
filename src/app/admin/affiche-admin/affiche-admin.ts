import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../home/homeService';

import * as displayOptions from '../../../assets/display-options.json'; 

const SESSION_STORAGE_KEY = 'selectedDisplayId';

export interface Presentation {
  cle: number;
  balise: string;
  valeur: string;
}

export interface Affiche {
  id: number;
  imageUrl: string; 
  description: string;
  presentations: Presentation[];
}

@Component({
  standalone: true,
  selector: 'app-admin-affiche',
  imports: [RouterModule, FormsModule],
  templateUrl: './affiche-admin.html',
  styleUrls: ['../admin.css']
})
export class AfficheComponent implements OnInit {
  
  public options: Affiche[] = (displayOptions as any).default || displayOptions; 
  
  public selectedDisplayId: number | undefined = this.options[0]?.id; 

  constructor(private homeService: HomeService) { } 

  ngOnInit(): void {
    this.loadSavedDisplayId();
  }

  private loadSavedDisplayId(): void {
    const savedId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    
    if (savedId !== null) {
      const parsedId = Number(savedId);
      const optionExists = this.options.some(option => option.id === parsedId);
      
      if (optionExists) {
        this.selectedDisplayId = parsedId;
        console.log(`ID chargé depuis sessionStorage : ${this.selectedDisplayId}`);
      } else {
        this.selectedDisplayId = this.options[0]?.id;
      }

    } else {
      this.selectedDisplayId = this.options[0]?.id;
    }
  }

  public onDisplayChange(): void {
  if (this.selectedDisplayId === undefined) {
      console.warn("Aucun ID sélectionné.");
      return;
    }
    
    sessionStorage.setItem(SESSION_STORAGE_KEY, this.selectedDisplayId.toString());
    console.log(`Nouvel ID sauvegardé dans sessionStorage : ${this.selectedDisplayId}`);
    
    const payload = { 
      type: 'UPDATE_DISPLAY_ID_COMMAND',
      displayId: this.selectedDisplayId
    };
    
    this.homeService.sendDisplayChoice(payload);
  }
}