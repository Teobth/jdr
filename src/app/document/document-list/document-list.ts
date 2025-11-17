import { Component, OnInit } from '@angular/core';
import { Doc, DocumentService } from '../documentService';
import { map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true, // Assurez-vous que c'est bien Standalone
  selector: 'app-document-list',
  imports: [
    CommonModule, 
    RouterLink
  ],
  templateUrl: './document-list.html',
  styleUrl: './document-list.css'
})
export class DocumentListComponent implements OnInit {

  document$!: Observable<Doc[]>; 

constructor(private documentService: DocumentService) { }

  ngOnInit(): void {
    this.document$ = this.documentService.documents$.pipe(
      map(documents => {
          // Correction pour garantir que 'documents' est un tableau avant le filtre
          if (!Array.isArray(documents)) { 
              return [];
          }
          return documents.filter(d => d.accessible); 
      })
    );
  }
  
  // 3. Méthode pour appeler la modification dans le service
  onToggleAcces(doc: Doc): void {
      this.documentService.toggleAcces(doc);
  }
}