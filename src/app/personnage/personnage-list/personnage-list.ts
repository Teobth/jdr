import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common'; 
import { RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { PersonnageService, Personnage } from '../personnageService'; 

@Component({
  standalone: true, 
  imports: [CommonModule, RouterLink, AsyncPipe], 
  selector: 'app-personnage',
  templateUrl: './personnage-list.html',
  styleUrls: ['./personnage-list.css']
})
export class PersonnageListComponent implements OnInit {

  personnages$!: Observable<Personnage[]>;

  constructor(private personnageService: PersonnageService) { }

  ngOnInit(): void {
    // 1. Abonnement au flux de données du service
    this.personnages$ = this.personnageService.personnages$.pipe(
      // 2. Filtre : Afficher que les jouables
      map(personnages => personnages.filter(p => p.rencontre))
    );
  }
  
  // 3. Méthode pour appeler la modification dans le service
  onToggleRencontre(p: Personnage): void {
      this.personnageService.toggleRencontre(p);
  }
}