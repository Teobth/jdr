import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject, combineLatest, map, startWith } from 'rxjs';
import { Personnage, PersonnageService } from '../service/personnageService';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-personnages',
  imports: [CommonModule, RouterModule],
  templateUrl: '../html/admin-personnage.html',
  styleUrls: ['../css/admin.css']
})
export class AdminPersonnagesComponent implements OnInit {

  personnages$!: Observable<Personnage[]>; 

  private filtreRencontreSubject = new BehaviorSubject<boolean>(false);
  afficherSeulementRencontre$ = this.filtreRencontreSubject.asObservable();
  
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
          // Afficher tous les personnages (y compris les non rencontrés)
          return tousLesPersonnages; 
        }
      })
    );
  }

  basculerFiltre(): void {
    const nouvelEtat = !this.filtreRencontreSubject.value;
    this.filtreRencontreSubject.next(nouvelEtat);
  }

  basculerRencontre(p: Personnage): void {
    this.personnageService.toggleRencontre(p);
  }

  toggleSecret(personnageNom: string, secretCle: string): void {
    this.personnageService.toggleSecretDebloque(personnageNom, secretCle);
  }
}