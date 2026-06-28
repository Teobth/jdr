import { Component, computed, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Doc, DocumentService } from '../service/documentService';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-documents',
  imports: [CommonModule, RouterModule],
  templateUrl: '../html/admin-document.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['../css/admin.css']
})
export class AdminDocumentsComponent {
  private documentService = inject(DocumentService);
  readonly afficherSeulementCaches = signal(true);

  readonly documentsFiltre = computed(() => {
    const tous = this.documentService.documentsSignal();
    const filtre = this.afficherSeulementCaches();
    return filtre ? tous.filter(d => !d.accessible) : tous;
  });

  basculerFiltre(): void {
    this.afficherSeulementCaches.update(v => !v);
  }

  basculerAcces(doc: Doc): void {
    this.documentService.toggleAcces(doc);
  }
}