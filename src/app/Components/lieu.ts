import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { LieuService } from '../service/lieuService'; 

@Component({
  standalone: true, 
  selector: 'app-home',
  templateUrl: '../html/lieu.html', 
  styleUrls: ['../css/lieu.css'],
  imports: [CommonModule, RouterModule, FormsModule]
})

export class LieuComponent {
  private lieuService = inject(LieuService);

  readonly detailsAffiche = computed(() => {
    const lieuRecu = this.lieuService.lieuActuel();
    const data = this.lieuService.donneesServeur();

    if (!lieuRecu || !data) return undefined;

    return data.affiches?.find(
      (item: any) => Number(item.id) === Number(lieuRecu.id)
    );
  });
}