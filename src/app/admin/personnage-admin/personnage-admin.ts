import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // 👈 Importez AsyncPipe
import { Observable, BehaviorSubject, combineLatest, map, startWith } from 'rxjs'; // 👈 Nouveaux imports RxJS
import { Personnage, PersonnageService } from '../../personnage/personnageService'; // L'import du service doit être correct
import { RouterModule } from '@angular/router';

@Component({
  standalone: true, // Ajoutez standalone: true si ce n'est pas déjà fait
  selector: 'app-admin-personnages',
  imports: [CommonModule, RouterModule],
  templateUrl: './personnage-admin.html',
  styleUrls: ['../admin.css']
})
export class AdminPersonnagesComponent implements OnInit {

  personnages$!: Observable<Personnage[]>; 

  private filtreRencontreSubject = new BehaviorSubject<boolean>(false);
  afficherSeulementRencontre$ = this.filtreRencontreSubject.asObservable();
  
  // Vous pouvez utiliser une propriété simple pour l'état initial
  afficherSeulementRencontre: boolean = false; 

  constructor(public personnageService: PersonnageService) {}

  ngOnInit(): void {
    this.personnages$ = combineLatest([
      // 1. Le flux de données du service (mis à jour par toggleJouable/BroadcastChannel)
      this.personnageService.personnages$, 
      // 2. Le flux du filtre local (mis à jour par basculerFiltre)
      this.filtreRencontreSubject.asObservable().pipe(startWith(this.afficherSeulementRencontre))
      
    ]).pipe(
      // Appliquer la logique de filtre à chaque fois qu'un des flux change
      map(([tousLesPersonnages, seulementRencontre]) => {
        // Mettre à jour la propriété simple pour l'affichage du bouton
        this.afficherSeulementRencontre = seulementRencontre;
        
        if (seulementRencontre) {
          return tousLesPersonnages.filter(p => p.rencontre);
        } else {
          // Afficher tous les personnages (y compris les PNJ)
          return tousLesPersonnages; 
        }
      })
    );
  }

  basculerFiltre(): void {
    // 🎯 Utiliser le BehaviorSubject pour la réactivité
    const nouvelEtat = !this.filtreRencontreSubject.value;
    this.filtreRencontreSubject.next(nouvelEtat);
  }

  basculerRencontre(p: Personnage): void {
    // 🎯 Utiliser la méthode réactive du service
    this.personnageService.toggleRencontre(p);
    // Plus besoin de rafraîchir manuellement, le flux le fait
  }

  toggleSecret(personnageNom: string, secretCle: string): void {
    // 🛑 Utilise la méthode du service que nous avons créée précédemment
    this.personnageService.toggleSecretDebloque(personnageNom, secretCle);
  }
}