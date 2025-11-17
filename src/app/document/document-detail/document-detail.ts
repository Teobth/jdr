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
      map(params => params.get('id')),
      switchMap(nom => this.documentService.documents$.pipe(
        map(documents => documents.find(d => d.id.toLowerCase() === nom?.toLowerCase()))
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
}