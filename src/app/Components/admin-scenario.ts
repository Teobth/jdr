import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ScenarioService, ScenarioStep, StatutEtape } from '../service/scenarioService';
import { PersonnageService } from '../service/personnageService';
import { DocumentService } from '../service/documentService';
import { AfficheComponent } from './admin-affiche';

/** Brouillon local utilisé par le formulaire de création/édition. */
interface BrouillonEtape {
  id: number | null;
  title: string;
  chapter: string;
  summary: string;
  description: string;
  status: StatutEtape;
  personnagesLies: string[];
  documentsLies: number[];
}

function brouillonVierge(chapitreParDefaut: string): BrouillonEtape {
  return {
    id: null,
    title: '',
    chapter: chapitreParDefaut,
    summary: '',
    description: '',
    status: 'BLOQUÉ',
    personnagesLies: [],
    documentsLies: []
  };
}

@Component({
  selector: 'app-scenario-tracker',
  templateUrl: '../html/admin-scenario.html',
  styleUrls: ['../css/admin.css', '../css/admin-scenario.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterModule, FormsModule, AfficheComponent, CommonModule]
})
export class ScenarioAdminComponent {
  private scenarioService = inject(ScenarioService);
  private personnageService = inject(PersonnageService);
  private documentService = inject(DocumentService);

  readonly scenario = computed(() => this.scenarioService.scenarioSignal());

  // --- Filtres ---
  readonly afficherSeulementNonCompletes = signal(false);
  readonly chapitreSelectionne = signal<string>('TOUT');

  readonly listeChapitres = computed(() => {
    const chapitres = this.scenario().map(s => s.chapter || 'Sans chapitre');
    return ['TOUT', ...Array.from(new Set(chapitres))];
  });

  /** Étapes groupées par chapitre, dans l'ordre d'apparition des chapitres, triées par id dans chaque groupe. */
  readonly chapitresAffiches = computed(() => {
    let liste = this.scenario();

    if (this.chapitreSelectionne() !== 'TOUT') {
      liste = liste.filter(s => s.chapter === this.chapitreSelectionne());
    }
    if (this.afficherSeulementNonCompletes()) {
      liste = liste.filter(s => s.status !== 'COMPLÉTÉ');
    }

    const groupes = new Map<string, ScenarioStep[]>();
    for (const etape of liste) {
      const cle = etape.chapter || 'Sans chapitre';
      const groupe = groupes.get(cle) ?? [];
      groupe.push(etape);
      groupes.set(cle, groupe);
    }

    return Array.from(groupes.entries()).map(([chapter, etapes]) => ({
      chapter,
      etapes: etapes.slice().sort((a, b) => a.id - b.id)
    }));
  });

  basculerFiltre(): void {
    this.afficherSeulementNonCompletes.update(v => !v);
  }

  selectionnerChapitre(chapitre: string): void {
    this.chapitreSelectionne.set(chapitre);
  }

  // --- Sélection / panneau de droite ---

  /** Id de l'étape actuellement affichée en détail dans le panneau de droite (null = rien de sélectionné). */
  readonly etapeSelectionneeId = signal<number | null>(null);

  readonly etapeSelectionnee = computed<ScenarioStep | null>(() => {
    const id = this.etapeSelectionneeId();
    if (id === null) return null;
    return this.scenario().find(s => s.id === id) ?? null;
  });

  /** Mode d'affichage du panneau de droite : détail, formulaire d'édition, ou vide. */
  readonly modePanneau = signal<'detail' | 'formulaire' | 'vide'>('vide');

  selectionnerEtape(step: ScenarioStep): void {
    this.etapeSelectionneeId.set(step.id);
    this.modePanneau.set('detail');
  }

  fermerPanneau(): void {
    this.etapeSelectionneeId.set(null);
    this.brouillon.set(null);
    this.modePanneau.set('vide');
  }

  // --- Listes pour le formulaire (personnages / documents disponibles) ---

  readonly personnagesDisponibles = computed(() => this.personnageService.personnagesSignal());
  readonly documentsDisponibles = computed(() => this.documentService.documentsSignal());

  // --- Personnages / documents liés à l'étape affichée (pour le panneau détail) ---

  readonly personnagesLiesAffiches = computed(() => {
    const etape = this.etapeSelectionnee();
    if (!etape) return [];
    const noms = new Set(etape.personnagesLies ?? []);
    return this.personnagesDisponibles().filter(p => noms.has(p.nom));
  });

  readonly documentsLiesAffiches = computed(() => {
    const etape = this.etapeSelectionnee();
    if (!etape) return [];
    const ids = new Set(etape.documentsLies ?? []);
    return this.documentsDisponibles().filter(d => ids.has(d.id));
  });

  // --- Formulaire de création / édition ---

  readonly brouillon = signal<BrouillonEtape | null>(null);

  ouvrirCreation(): void {
    const chapitreParDefaut = this.chapitreSelectionne() !== 'TOUT'
      ? this.chapitreSelectionne()
      : '';
    this.etapeSelectionneeId.set(null);
    this.brouillon.set(brouillonVierge(chapitreParDefaut));
    this.modePanneau.set('formulaire');
  }

  ouvrirEdition(step: ScenarioStep): void {
    this.etapeSelectionneeId.set(step.id);
    this.brouillon.set({
      id: step.id,
      title: step.title,
      chapter: step.chapter,
      summary: step.summary ?? '',
      description: step.description,
      status: step.status,
      personnagesLies: [...(step.personnagesLies ?? [])],
      documentsLies: [...(step.documentsLies ?? [])]
    });
    this.modePanneau.set('formulaire');
  }

  annulerFormulaire(): void {
    const idEnCours = this.brouillon()?.id ?? null;
    this.brouillon.set(null);
    if (idEnCours !== null) {
      this.etapeSelectionneeId.set(idEnCours);
      this.modePanneau.set('detail');
    } else {
      this.modePanneau.set('vide');
    }
  }

  /** Coche/décoche un personnage dans le brouillon en cours d'édition. */
  toggleParticipant(nom: string): void {
    const b = this.brouillon();
    if (!b) return;
    const deja = b.personnagesLies.includes(nom);
    const personnagesLies = deja
      ? b.personnagesLies.filter(n => n !== nom)
      : [...b.personnagesLies, nom];
    this.brouillon.set({ ...b, personnagesLies });
  }

  /** Coche/décoche un document dans le brouillon en cours d'édition. */
  toggleDocumentLie(id: number): void {
    const b = this.brouillon();
    if (!b) return;
    const deja = b.documentsLies.includes(id);
    const documentsLies = deja
      ? b.documentsLies.filter(d => d !== id)
      : [...b.documentsLies, id];
    this.brouillon.set({ ...b, documentsLies });
  }

  enregistrerFormulaire(): void {
    const b = this.brouillon();
    if (!b || !b.title.trim() || !b.chapter.trim()) return;

    const champsCommuns = {
      title: b.title.trim(),
      chapter: b.chapter.trim(),
      summary: b.summary.trim(),
      description: b.description,
      status: b.status,
      personnagesLies: b.personnagesLies,
      documentsLies: b.documentsLies
    };

    if (b.id === null) {
      this.scenarioService.creerEtape(champsCommuns);
      this.brouillon.set(null);
      this.modePanneau.set('vide');
    } else {
      this.scenarioService.modifierEtape(b.id, champsCommuns);
      this.etapeSelectionneeId.set(b.id);
      this.brouillon.set(null);
      this.modePanneau.set('detail');
    }
  }

  supprimerEtape(step: ScenarioStep): void {
    this.scenarioService.supprimerEtape(step.id);
    if (this.etapeSelectionneeId() === step.id) {
      this.fermerPanneau();
    }
  }

  updateStatus(step: ScenarioStep, newStatus: StatutEtape): void {
    this.scenarioService.updateStatus(step.id, newStatus);
  }

  // --- Présentation ---

  getStatusClass(status: string): string {
    switch (status) {
      case 'BLOQUÉ': return 'bloque';
      case 'EN COURS': return 'en-cours';
      case 'COMPLÉTÉ': return 'complete';
      default: return '';
    }
  }

  getShortSummary(step: ScenarioStep): string {
    if (step.summary) return step.summary;
    const premiereLigne = step.description.split('\n')[0];
    return premiereLigne.length > 100 ? premiereLigne.substring(0, 100) + '...' : premiereLigne;
  }
}