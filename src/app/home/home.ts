import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { HomeService } from './homeService'; 
import { Affiche } from '../admin/affiche-admin/affiche-admin'; 
import { Subscription } from 'rxjs';

import * as displayOptions from '../../assets/display-options.json';

@Component({
  standalone: true, 
  selector: 'app-home',
  templateUrl: './home.html', 
  styleUrls: ['./home.css'],
  imports: [
    RouterModule,
    CommonModule,
    FormsModule 
  ]
})
export class HomeComponent implements OnInit, OnDestroy {

  listeOptions: Affiche[] = (displayOptions as any).default || displayOptions;  
  detailsAffiche: Affiche | undefined = undefined;

  private selectionSubscription!: Subscription;

  constructor(private homeService: HomeService) { } 

  ngOnInit(): void {
    this.selectionSubscription = this.homeService.getDisplayUpdates().subscribe({
      next: (message) => {
        if (message.type === 'UPDATE_DISPLAY_ID' && message.displayId !== undefined) {
          const newAfficheId = message.displayId; 
          this.detailsAffiche = this.listeOptions.find(a => a.id === newAfficheId);

        } else if (message.type === 'INITIAL_STATE' && message.payload.displayId !== undefined) {
          const initialAfficheId = message.payload.displayId;
          this.detailsAffiche = this.listeOptions.find(a => a.id === initialAfficheId);
        }
      }
    });
  }

  ngOnDestroy(): void {
    // **Très important : se désabonner pour éviter les fuites de mémoire !**
    if (this.selectionSubscription) {
      this.selectionSubscription.unsubscribe();
    }
  }
}