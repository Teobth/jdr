import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../service/documentService'; 

@Component({
  standalone: true,
  selector: 'app-document-detail',
  templateUrl: '../html/document-detail.html',
  styleUrls: ['../css/document-detail.css'],
  imports: [CommonModule, RouterLink] 
})
export class DocumentDetailComponent {
  private documentService = inject(DocumentService);
  id = input<string>();
  readonly doc = computed(() => {
    const idSaisi = this.id();
    return this.documentService.documentsSignal()
      .find(d => d.id.toString() === idSaisi);
  });
}