import { Component, OnInit } from '@angular/core';
import { Doc, DocumentService } from '../documentService';
import { map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
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
          if (!Array.isArray(documents)) { 
              return [];
          }
          return documents.filter(d => d.accessible); 
      })
    );
  }
  
  onToggleAcces(doc: Doc): void {
      this.documentService.toggleAcces(doc);
  }
}