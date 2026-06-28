import { Component, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Doc, DocumentService } from '../service/documentService';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-document-list',
  imports: [
    CommonModule, 
    RouterLink
  ],
  templateUrl: '../html/document-list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: '../css/document-list.css'
})

export class DocumentListComponent {
  constructor(private documentService: DocumentService) { }

  readonly documentsFiltres = computed(() => {
    return this.documentService.documentsSignal().filter(d => d.accessible);
  });
  
  onToggleAcces(doc: Doc): void {
      this.documentService.toggleAcces(doc);
  }
}