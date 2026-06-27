import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WS_BASE_URL } from '../constante';
import { AfficheComponent } from "./admin-affiche";

declare var WebSocket: any;

interface ScenarioStep {
  id: number;
  chapter: string;
  title: string;
  summary?: string;
  description: string;
  status: 'BLOQUÉ' | 'EN COURS' | 'COMPLÉTÉ';
}

@Component({
  selector: 'app-scenario-tracker',
  templateUrl: '../html/admin-scenario.html',
  styleUrls: ['../css/admin.css'],
  standalone: true,
  imports: [RouterModule, FormsModule, AfficheComponent, CommonModule]
})
export class ScenarioAdminComponent implements OnInit {

  scenario: ScenarioStep[] = [];
  afficherSeulementNonCompletes: boolean = false; // Par défaut à false pour voir le travail accompli
  chapitreSelectionne: string = 'TOUT'; // Filtre de chapitre par défaut
  expandedSteps: Set<number> = new Set<number>();

  private ws: WebSocket | null = null;
  private readonly WS_URL = WS_BASE_URL;
  
  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.connectWebSocket();
  }

  /**
   * Extrait la liste unique des chapitres disponibles
   */
  get listeChapitres(): string[] {
    const chapitres = this.scenario.map(step => step.chapter || 'Sans Chapitre');
    return ['TOUT', ...Array.from(new Set(chapitres))];
  }

  /**
   * Retourne la liste filtrée selon le statut ET le chapitre sélectionné
   */
  get filteredScenario(): ScenarioStep[] {
    let liste = this.scenario;

    // 1. Filtre par chapitre
    if (this.chapitreSelectionne !== 'TOUT') {
      liste = liste.filter(step => step.chapter === this.chapitreSelectionne);
    }

    // 2. Filtre par statut complété
    if (this.afficherSeulementNonCompletes) {
      liste = liste.filter(step => step.status !== 'COMPLÉTÉ');
    }

    return liste;
  }

  basculerFiltre(): void {
    this.afficherSeulementNonCompletes = !this.afficherSeulementNonCompletes;
  }

  selectionnerChapitre(chapitre: string): void {
    this.chapitreSelectionne = chapitre;
  }
  
  private connectWebSocket(): void {
    const ws = new WebSocket(this.WS_URL);
    this.ws = ws;

    ws.onopen = () => console.log('Connexion WebSocket établie.');

    ws.onmessage = (event: { data: string; }) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'INITIAL_STATE' || data.type === 'UPDATE_SCENARIO') {
          this.scenario = data.payload.scenario || data.payload; 
          this.sortScenarioById();
          this.cdr.detectChanges(); 
        }
      } catch (error) {
        console.error("Erreur WebSocket:", error);
      }
    };

    ws.onclose = () => setTimeout(() => this.connectWebSocket(), 5000); 
    ws.onerror = () => this.ws?.close();
  }
  
  updateStatus(step: ScenarioStep, newStatus: 'BLOQUÉ' | 'EN COURS' | 'COMPLÉTÉ'): void {
    const command = { type: 'UPDATE_STATUS_COMMAND', stepId: step.id, newStatus: newStatus };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    }
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'BLOQUÉ': return 'bloque';
      case 'EN COURS': return 'en-cours';
      case 'COMPLÉTÉ': return 'complete';
      default: return '';
    }
  }

  private sortScenarioById(): void {
    this.scenario.sort((a, b) => a.id - b.id);
  }

  toggleExpand(stepId: number): void {
    if (this.expandedSteps.has(stepId)) {
      this.expandedSteps.delete(stepId);
    } else {
      this.expandedSteps.add(stepId);
    }
  }

  isExpanded(stepId: number): boolean {
    return this.expandedSteps.has(stepId);
  }

  getShortSummary(step: ScenarioStep): string {
    if (step.summary) return step.summary;
    // Coupe le texte à la première phrase ou aux 120 premiers caractères
    const firstLine = step.description.split('\n')[0];
    return firstLine.length > 120 ? firstLine.substring(0, 120) + '...' : firstLine;
  }
}