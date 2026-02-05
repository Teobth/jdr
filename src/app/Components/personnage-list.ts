import { Component, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterLink } from '@angular/router';
import { PersonnageService, Personnage } from '../service/personnageService'; 

@Component({
  standalone: true, 
  imports: [CommonModule, RouterLink], 
  selector: 'app-personnage-list',
  templateUrl: '../html/personnage-list.html',
  styleUrls: ['../css/personnage-list.css']
})

export class PersonnageListComponent {
  constructor(private personnageService: PersonnageService) { }

  readonly personnagesFiltres = computed(() => {
    return this.personnageService.personnagesSignal().filter(p => p.rencontre);
  });

  onToggleRencontre(p: Personnage): void {
      this.personnageService.toggleRencontre(p);
  }
}