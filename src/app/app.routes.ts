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
import { LoginComponent } from './Components/login';
import { MonPersonnageComponent } from './Components/monPerso';
import { CarteComponent } from './Components/carte';
import { AdminCarteComponent } from './Components/admin-carte';
import { authGuard } from './service/authGuard';
import { adminGuard } from './service/adminGuard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  { path: '', component: LieuComponent, canActivate: [authGuard] },

  { path: 'mon-personnage', component: MonPersonnageComponent, canActivate: [authGuard] },

  { path: 'carte', component: CarteComponent, canActivate: [authGuard] },

  { path: 'personnages', component: PersonnageListComponent, canActivate: [authGuard] },
  
  { path: 'personnages/:nom', component: PersonnageDetailComponent, canActivate: [authGuard] },

  { path: 'documents', component: DocumentListComponent, canActivate: [authGuard] },

  { path: 'documents/:id', component: DocumentDetailComponent, canActivate: [authGuard] },

  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'personnages', component: AdminPersonnagesComponent },
      { path: 'documents', component: AdminDocumentsComponent },
      { path: 'scenario', component: ScenarioAdminComponent },
      { path: 'affiches', component: AfficheComponent },
      { path: 'carte', component: AdminCarteComponent },
      { path: '', redirectTo: 'scenario', pathMatch: 'full' }
    ]
  }

];