import { Component, computed, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PersonnageService } from '../service/personnageService'; 

@Component({
  standalone: true,
  selector: 'app-personnage-detail',
  templateUrl: '../html/personnage-detail.html',
  styleUrls: ['../css/personnage-detail.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, RouterLink] 
})
export class PersonnageDetailComponent {
  private personnageService = inject(PersonnageService);
  nom = input<string>(); 
  readonly personnage = computed(() => {
    const nomSaisi = this.nom();
    return this.personnageService.personnagesSignal()
      .find(p => p.nom.toLowerCase() === nomSaisi?.toLowerCase());
  });

  readonly secretsDebloques = computed(() => {
    return this.personnage()?.secrets.filter(s => s.debloque) ?? [];
  });
}