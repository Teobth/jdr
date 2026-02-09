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

  // document$!: Observable<Doc | undefined>; 
  
  // doc: Doc | undefined; 

  // constructor(
  //   private route: ActivatedRoute,
  //   private documentService: DocumentService
  // ) { }

  // ngOnInit(): void {
  //   this.document$ = this.route.paramMap.pipe(
  //     map(params => Number(params.get('id'))),
  //     switchMap(idNumber => this.documentService.documents$.pipe(
  //       map(documents => documents.find(d => d.id === idNumber))
  //     )),
  //     map(d => {
  //       this.doc = d;
  //       return d;
  //     })
  //   );
  //   this.document$.subscribe(d => {
  //       this.doc = d;
  //   });
  // }

  // ouvrirDocument(id: string | number) {
  //   const url = `${id}`;
  //   window.open(url, '_blank');
  // }
}