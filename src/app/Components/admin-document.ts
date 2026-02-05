import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { Observable, BehaviorSubject, combineLatest, map, startWith } from 'rxjs'; 
import { Doc, DocumentService } from '../service/documentService';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-admin-documents',
  imports: [CommonModule, RouterModule],
  templateUrl: '../html/admin-document.html',
  styleUrls: ['../css/admin.css']
})
export class AdminDocumentsComponent implements OnInit {

  documents$!: Observable<Doc[]>; 

  private filtreVisibiliteSubject = new BehaviorSubject<boolean>(false);
  
  afficherSeulementCaches: boolean = true; 

  constructor(public documentService: DocumentService) {}

  ngOnInit(): void {
    this.documents$ = combineLatest([
      this.documentService.documents$, 
      this.filtreVisibiliteSubject.asObservable().pipe(startWith(this.afficherSeulementCaches))
      
    ]).pipe(
      map(([tousLesDocuments, seulementCache]) => {
        this.afficherSeulementCaches = seulementCache;
        if (seulementCache) {
          return tousLesDocuments.filter(d => !d.accessible);
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