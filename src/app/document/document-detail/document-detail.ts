import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, map, switchMap } from 'rxjs'
import { Doc, DocumentService } from '../documentService'; 

@Component({
  standalone: true,
  selector: 'app-document-detail',
  templateUrl: './document-detail.html',
  styleUrls: ['./document-detail.css'],
  imports: [CommonModule, RouterLink] 
})
export class DocumentDetailComponent implements OnInit {

  document$!: Observable<Doc | undefined>; 
  
  doc: Doc | undefined; 

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService
  ) { }

  ngOnInit(): void {
    this.document$ = this.route.paramMap.pipe(
      map(params => Number(params.get('id'))),
      switchMap(idNumber => this.documentService.documents$.pipe(
        map(documents => documents.find(d => d.id === idNumber))
      )),
      map(d => {
        this.doc = d;
        return d;
      })
    );
    this.document$.subscribe(d => {
        this.doc = d;
    });
  }

  ouvrirDocument(id: string | number) {
    const url = `${id}`;
    window.open(url, '_blank');
  }
}