import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Observable, BehaviorSubject, combineLatest, map, startWith } from 'rxjs'; 
import { Doc, DocumentService } from '../../document/documentService';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-documents',
  imports: [CommonModule, RouterModule],
  templateUrl: './document-admin.html',
  styleUrls: ['../admin.css']
})
export class AdminDocumentsComponent implements OnInit {

  documents$!: Observable<Doc[]>; 

  private filtreVisibiliteSubject = new BehaviorSubject<boolean>(false);
  
  afficherSeulementVisibles: boolean = false; 

  constructor(public documentService: DocumentService) {}

  ngOnInit(): void {
    this.documents$ = combineLatest([
      this.documentService.documents$, 
      this.filtreVisibiliteSubject.asObservable().pipe(startWith(this.afficherSeulementVisibles))
      
    ]).pipe(
      map(([tousLesDocuments, seulementVisible]) => {
        this.afficherSeulementVisibles = seulementVisible;
        if (seulementVisible) {
          return tousLesDocuments.filter(d => d.accessible);
        } else {
          return tousLesDocuments; 
        }
      })
    );
  }

  basculerFiltre(): void {
    const nouvelEtat = !this.filtreVisibiliteSubject.value;
    this.filtreVisibiliteSubject.next(nouvelEtat);
  }

  basculerAcces(doc: Doc): void {
    this.documentService.toggleAcces(doc);
  }
}