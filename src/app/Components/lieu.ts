import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { Lieu, LieuService } from '../service/lieuService'; 
import { ImageBuilderService } from '../service/imageBuilderService';

@Component({
  standalone: true, 
  selector: 'app-home',
  templateUrl: '../html/lieu.html', 
  styleUrls: ['../css/lieu.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, RouterModule, FormsModule]
})

export class LieuComponent {
  private lieuService = inject(LieuService);
  private imageBuilder = inject(ImageBuilderService);

  // Utilisation directe des signaux du service
  readonly detailsAffiche = computed(() => {
    const lieuActuel = this.lieuService.lieuActuel();
    const data = this.lieuService.donneesServeur();

    if (!lieuActuel || !data.affiches) return undefined;

    return data.affiches.find(
      (item: any) => Number(item.id) === Number(lieuActuel.id)
    );
  });

  protected getUrl(l: Lieu) {
    return this.imageBuilder.generateImageUrl(l.imageUrl || '');
  }
}