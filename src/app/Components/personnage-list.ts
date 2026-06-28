import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterLink } from '@angular/router';
import { PersonnageService, Personnage } from '../service/personnageService';
import { ImageBuilderService } from '../service/imageBuilderService';

@Component({
  standalone: true, 
  imports: [CommonModule, RouterLink], 
  selector: 'app-personnage-list',
  templateUrl: '../html/personnage-list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['../css/personnage-list.css']
})

export class PersonnageListComponent {
  private personnageService = inject(PersonnageService);
  private imageService = inject(ImageBuilderService);

  readonly personnagesFiltres = computed(() => {
    return this.personnageService.personnagesSignal().filter(p => p.rencontre);
  });

  getUrl(p: Personnage): string {
    return this.imageService.generateImageUrl(p.portraitUrl);
  }

  onToggleRencontre(p: Personnage): void {
      this.personnageService.toggleRencontre(p);
  }
}