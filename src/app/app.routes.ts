import { Routes } from '@angular/router';
import { HomeComponent } from './home/home'; 
import { PersonnageListComponent } from './personnage/personnage-list/personnage-list'; 
import { PersonnageDetailComponent } from './personnage/personnage-detail/personnage-detail';
import { AdminPersonnagesComponent } from './admin/personnage-admin/personnage-admin';
import { DocumentListComponent } from './document/document-list/document-list';
import { AdminDocumentsComponent } from './admin/document-admin/document-admin';
import { AdminComponent } from './admin/admin';
import { DocumentDetailComponent } from './document/document-detail/document-detail';
import { ScenarioAdminComponent } from './admin/scenario-admin/scenario-admin';
import { AfficheComponent } from './admin/affiche-admin/affiche-admin';

export const routes: Routes = [
  { path: '', component: HomeComponent }, 
  
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