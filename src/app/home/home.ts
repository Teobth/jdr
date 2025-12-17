import { Component, OnDestroy, OnInit } from '@angular/core';
 
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { HomeService } from './homeService'; 
import { Affiche } from '../admin/affiche-admin/affiche-admin'; 
import { Subject, Subscription, takeUntil } from 'rxjs';

import * as displayOptions from '../../assets/json/display-options.json';

@Component({
  standalone: true, 
  selector: 'app-home',
  templateUrl: './home.html', 
  styleUrls: ['./home.css'],
  imports: [
    RouterModule,
    FormsModule
]
})
export class HomeComponent implements OnInit, OnDestroy {

  listeOptions: Affiche[] = (displayOptions as any).default || displayOptions;  
  detailsAffiche: Affiche | undefined = undefined;

  private selectionSubscription!: Subscription;

  private destroy$ = new Subject<void>();

  constructor(private homeService: HomeService) { } 

  ngOnInit(): void {
    this.selectionSubscription = this.homeService.getDisplayUpdates()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (message) => {
        if (message === null)
          return;
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
    if (this.selectionSubscription) {
      this.selectionSubscription.unsubscribe();
      this.destroy$?.complete();
    }
  }
}