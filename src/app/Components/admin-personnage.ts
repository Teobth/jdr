import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Personnage, PersonnageService } from '../service/personnageService';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-personnages',
  imports: [CommonModule, RouterModule],
  templateUrl: '../html/admin-personnage.html',
  styleUrls: ['../css/admin.css']
})
export class AdminPersonnagesComponent {
  private personnageService = inject(PersonnageService);

  readonly afficherSeulementRencontre = signal(false);

  readonly personnageFiltre = computed(() => {
    const tous = this.personnageService.personnagesSignal();
    const filtre = this.afficherSeulementRencontre();
    return filtre ? tous.filter(p => p.rencontre) : tous;
  });

  basculerFiltre(): void {
    this.afficherSeulementRencontre.update(v => !v);
  }

  basculerRencontre(p: Personnage): void {
    this.personnageService.toggleRencontre(p);
  }

  toggleSecret(personnageNom: string, secretCle: string): void {
    this.personnageService.toggleSecretDebloque(personnageNom, secretCle);
  }
}