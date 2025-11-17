import { Routes } from '@angular/router';

// 1. Importer les nouveaux composants
import { HomeComponent } from './home/home'; 
import { PersonnageListComponent } from './personnage/personnage-list/personnage-list'; 
import { PersonnageDetailComponent } from './personnage/personnage-detail/personnage-detail';
import { AdminPersonnagesComponent } from './admin/personnage-admin/personnage-admin';
import { DocumentListComponent } from './document/document-list/document-list';
import { AdminDocumentsComponent } from './admin/document-admin/document-admin';
import { AdminComponent } from './admin/admin';
import { DocumentDetailComponent } from './document/document-detail/document-detail';
import { ScenarioAdminComponent } from './admin/scenario-admin/scenario-admin';

export const routes: Routes = [
  // 2. Définir la route par défaut (la racine /) pour l'accueil
  { path: '', component: HomeComponent }, 
  
  // 3. Définir la route pour la liste des personnages
  { path: 'personnages', component: PersonnageListComponent }, 
  
  { path: 'personnages/:nom', component: PersonnageDetailComponent },

  { path: 'documents', component: DocumentListComponent },

  { path: 'documents/:id', component: DocumentDetailComponent },

  { path: 'admin', component: AdminComponent },

  { path: 'admin/personnages', component: AdminPersonnagesComponent },

  { path: 'admin/documents', component: AdminDocumentsComponent },

  { path: 'admin/scenario', component: ScenarioAdminComponent }

];