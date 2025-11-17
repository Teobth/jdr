import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, map, switchMap } from 'rxjs';
import { Personnage, Secret, PersonnageService } from '../personnageService'; 

@Component({
  standalone: true,
  selector: 'app-personnage-detail',
  templateUrl: './personnage-detail.html',
  styleUrls: ['./personnage-detail.css'],
  imports: [CommonModule, RouterLink] 
})
export class PersonnageDetailComponent implements OnInit {

  personnage$!: Observable<Personnage | undefined>; 
  
  personnage: Personnage | undefined; 

  constructor(
    private route: ActivatedRoute,
    private personnageService: PersonnageService
  ) { }

  ngOnInit(): void {
    // 1. Lire le paramètre 'nom' depuis l'URL (Observable)
    this.personnage$ = this.route.paramMap.pipe(
      map(params => params.get('nom')), // Récupère le nom
      // 2. Bascule du flux du nom vers le flux de tous les personnages
      switchMap(nom => this.personnageService.personnages$.pipe(
        // 3. Filtrer pour trouver le personnage correspondant au nom
        map(personnages => personnages.find(p => p.nom.toLowerCase() === nom?.toLowerCase()))
      )),
      // 4. Mettre à jour la propriété synchrone pour les méthodes de filtrage
      map(p => {
        this.personnage = p; // Met à jour la propriété synchrone
        return p;
      })
    );
    this.personnage$.subscribe(p => {
        this.personnage = p;
    });
  }
  
  /**
   * Méthode de filtrage pour le template (remplace le pipe).
   * Elle est appelée par le *ngFor dans le HTML.
   */
  getSecretsDebloques(): Secret[] {
    // Vérifie que le personnage et ses secrets existent
    if (!this.personnage || !this.personnage.secrets) {
      return [];
    }
    // Retourne le tableau des secrets où 'debloque' est true
    return this.personnage.secrets.filter(secret => secret.debloque === true);
  }
}