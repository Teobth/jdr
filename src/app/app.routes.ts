import { Routes } from '@angular/router';
import { LieuComponent } from './Components/lieu'; 
import { PersonnageListComponent } from './Components/personnage-list'; 
import { PersonnageDetailComponent } from './Components/personnage-detail';
import { AdminPersonnagesComponent } from './Components/admin-personnage';
import { DocumentListComponent } from './Components/document-list';
import { AdminDocumentsComponent } from './Components/admin-document';
import { AdminComponent } from './Components/admin';
import { DocumentDetailComponent } from './Components/document-detail';
import { ScenarioAdminComponent } from './Components/admin-scenario';
import { AfficheComponent } from './Components/admin-affiche';

export const routes: Routes = [
  { path: '', component: LieuComponent }, 
  
  { path: 'personnages', component: PersonnageListComponent }, 
  
  { path: 'personnages/:nom', component: PersonnageDetailComponent },

  { path: 'documents', component: DocumentListComponent },

  { path: 'documents/:id', component: DocumentDetailComponent },

  {
    path: 'admin',
    component: AdminComponent,
    children: [
      { path: 'personnages', component: AdminPersonnagesComponent },
      { path: 'documents', component: AdminDocumentsComponent },
      { path: 'scenario', component: ScenarioAdminComponent },
      { path: 'affiches', component: AfficheComponent },
      { path: '', redirectTo: 'scenario', pathMatch: 'full' }
    ]
  }

];