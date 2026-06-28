import { Component, computed, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  COMPETENCES_BASE,
  Competence,
  FicheCthulhu,
  PersonnageService
} from '../service/personnageService';

/** Construit une fiche vierge avec les caractéristiques à 0 et les ~45 compétences officielles en base. */
function ficheVierge(): FicheCthulhu {
  return {
    occupation: '',
    residence: '',
    lieuNaissance: '',
    sexe: '',

    caracteristiques: {
      FOR: 0, DEX: 0, POU: 0, CON: 0, APP: 0, EDU: 0, TAI: 0, INT: 0, MVT: 0
    },

    pv: 0,
    pvMax: 0,
    blessureGrave: false,

    pm: 0,
    pmMax: 0,

    santeMentale: 0,
    santeMentaleMax: 99,
    santeMentaleInitiale: 0,
    folieTemporaire: false,
    foliePersistante: false,

    chance: 0,

    impact: '+0',
    carrure: 0,
    esquive: 0,

    competences: COMPETENCES_BASE.map(c => ({ nom: c.nom, base: c.base, valeur: c.base })),
    armes: [],
    equipement: [],

    richesse: {
      depensesCourantes: '',
      especes: '',
      capital: ''
    },

    profil: {
      description: '',
      ideologieCroyances: '',
      personnesImportantes: '',
      lieuxSignificatifs: '',
      biensPrecieux: '',
      traits: '',
      sequellesCicatrices: '',
      phobiesManies: '',
      ouvragesOccultes: '',
      rencontresEntites: ''
    }
  };
}

@Component({
  standalone: true,
  selector: 'app-admin-fiche-personnage',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: '../html/admin-fiche-personnage.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['../css/admin.css', '../css/admin-fiche-personnage.css']
})
export class AdminFichePersonnageComponent {
  private personnageService = inject(PersonnageService);

  /** Nom du personnage, fourni par le routeur via withComponentInputBinding(). */
  nom = input<string>();

  readonly personnage = computed(() => {
    const nomSaisi = this.nom();
    return this.personnageService.personnagesSignal()
      .find(p => p.nom.toLowerCase() === nomSaisi?.toLowerCase());
  });

  /** Copie de travail locale, éditée par les formulaires puis envoyée au serveur sur "Enregistrer". */
  readonly brouillon = signal<FicheCthulhu | null>(null);

  /** Vrai dès qu'une fiche existe côté serveur OU qu'un brouillon est en cours de création. */
  readonly ficheExiste = computed(() => !!this.personnage()?.fiche || this.brouillon() !== null);

  readonly messageConfirmation = signal<string | null>(null);

  // --- Initialisation / création ---

  creerFiche(): void {
    this.brouillon.set(ficheVierge());
  }

  chargerFichePourEdition(): void {
    const fiche = this.personnage()?.fiche;
    if (fiche) {
      // Copie profonde simple via JSON pour ne pas muter le signal source pendant l'édition.
      this.brouillon.set(JSON.parse(JSON.stringify(fiche)));
    }
  }

  // --- Compétences (liste libre) ---

  ajouterCompetence(): void {
    const b = this.brouillon();
    if (!b) return;
    this.brouillon.set({ ...b, competences: [...b.competences, { nom: '', base: 0, valeur: 0 }] });
  }

  retirerCompetence(index: number): void {
    const b = this.brouillon();
    if (!b) return;
    this.brouillon.set({ ...b, competences: b.competences.filter((_, i) => i !== index) });
  }

  // --- Armes (liste libre) ---

  ajouterArme(): void {
    const b = this.brouillon();
    if (!b) return;
    const nouvelleArme = {
      nom: '', ordinaire: '', majeur: '', extreme: '',
      degats: '', portee: '', cadence: '', capacite: '', panne: ''
    };
    this.brouillon.set({ ...b, armes: [...b.armes, nouvelleArme] });
  }

  retirerArme(index: number): void {
    const b = this.brouillon();
    if (!b) return;
    this.brouillon.set({ ...b, armes: b.armes.filter((_, i) => i !== index) });
  }

  // --- Équipement (liste libre de chaînes) ---

  ajouterEquipement(): void {
    const b = this.brouillon();
    if (!b) return;
    this.brouillon.set({ ...b, equipement: [...b.equipement, ''] });
  }

  retirerEquipement(index: number): void {
    const b = this.brouillon();
    if (!b) return;
    this.brouillon.set({ ...b, equipement: b.equipement.filter((_, i) => i !== index) });
  }

  /** Met à jour un objet (texte) d'équipement à un index donné, depuis le template. */
  modifierEquipement(index: number, valeur: string): void {
    const b = this.brouillon();
    if (!b) return;
    const equipement = [...b.equipement];
    equipement[index] = valeur;
    this.brouillon.set({ ...b, equipement });
  }

  // --- Sauvegarde ---

  enregistrer(): void {
    const b = this.brouillon();
    const p = this.personnage();
    if (!b || !p) return;

    // Nettoyage : on retire les compétences/équipements vides en bout de saisie.
    const ficheNettoyee: FicheCthulhu = {
      ...b,
      competences: b.competences.filter(c => c.nom.trim() !== ''),
      armes: b.armes.filter(a => a.nom.trim() !== ''),
      equipement: b.equipement.filter(e => e.trim() !== '')
    };

    this.personnageService.mettreAJourFiche(p.nom, ficheNettoyee);
    this.messageConfirmation.set('Fiche enregistrée.');
    setTimeout(() => this.messageConfirmation.set(null), 3000);
  }

  annulerEdition(): void {
    this.brouillon.set(null);
  }

  trackByIndex(index: number): number {
    return index;
  }
}