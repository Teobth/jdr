import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WS_BASE_URL } from '../../constante';
import { AfficheComponent } from "../affiche-admin/affiche-admin";

declare var WebSocket: any;

interface ScenarioStep {
  id: number;
  title: string;
  description: string;
  status: 'BLOQUÉ' | 'EN COURS' | 'COMPLÉTÉ';
}

@Component({
  selector: 'app-scenario-tracker',
  templateUrl: './scenario-admin.html',
  styleUrls: ['../admin.css'],
  standalone: true,
  imports: [RouterModule, FormsModule, AfficheComponent, CommonModule]
})
export class ScenarioAdminComponent implements OnInit {

  scenario: ScenarioStep[] = [];
  afficherSeulementNonCompletes: boolean = false; // État du filtre
  
  private ws: WebSocket | null = null;
  private readonly WS_URL = WS_BASE_URL;
  
  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.connectWebSocket();
  }

  /**
   * Retourne la liste filtrée selon l'état du bouton
   */
  get filteredScenario(): ScenarioStep[] {
    if (this.afficherSeulementNonCompletes) {
      return this.scenario.filter(step => step.status !== 'COMPLÉTÉ');
    }
    return this.scenario;
  }

  /**
   * Bascule l'affichage entre "Tout" et "Non complétés"
   */
  basculerFiltre(): void {
    this.afficherSeulementNonCompletes = !this.afficherSeulementNonCompletes;
  }
  
  private connectWebSocket(): void {
    const ws = new WebSocket(this.WS_URL);
    this.ws = ws;

    ws.onopen = () => {
      console.log('Connexion WebSocket établie.');
    };

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

    ws.onclose = () => {
      setTimeout(() => this.connectWebSocket(), 5000); 
    };

    ws.onerror = (error: any) => {
      this.ws?.close();
    };
  }
  
  updateStatus(step: ScenarioStep, newStatus: 'BLOQUÉ' | 'EN COURS' | 'COMPLÉTÉ'): void {
    const command = {
      type: 'UPDATE_STATUS_COMMAND',
      stepId: step.id,
      newStatus: newStatus
    };
    
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
}