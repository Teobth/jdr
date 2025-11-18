import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WS_BASE_URL } from '../../constante';

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
  imports: [CommonModule, RouterModule, FormsModule]
})
export class ScenarioAdminComponent implements OnInit {

  scenario: ScenarioStep[] = [];
  private ws: WebSocket | null = null;
  private readonly WS_URL = WS_BASE_URL;
  
  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.connectWebSocket();
  }
  
  private connectWebSocket(): void {
    // 1. Ouvrir la connexion
    const ws = new WebSocket(this.WS_URL);
    this.ws = ws;

    ws.onopen = () => {
      console.log('Connexion WebSocket établie.');
    };

    // 2. Gérer les messages reçus du serveur
    ws.onmessage = (event: { data: string; }) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Message reçu:', data.type);

        if (data.type === 'INITIAL_STATE' || data.type === 'UPDATE_SCENARIO') {
          // Mettre à jour les données du scénario (initial ou mise à jour)
          this.scenario = data.payload.scenario || data.payload; 
          
          // Déclencher la détection de changement pour mettre à jour l'affichage
          this.cdr.detectChanges(); 
          
          console.log(`Scénario mis à jour, ${this.scenario.length} étapes chargées.`);
        }
      } catch (error) {
        console.error("Erreur lors de la réception/parsing du message WebSocket:", error);
      }
    };

    ws.onclose = () => {
      console.log('Connexion WebSocket fermée. Tentative de reconnexion dans 5s...');
      setTimeout(() => this.connectWebSocket(), 5000); 
    };

    ws.onerror = (error: any) => {
      console.error('Erreur WebSocket:', error);
      this.ws?.close();
    };
  }

  // --- Envoi de la Commande de Mise à Jour ---
  
  updateStatus(step: ScenarioStep, newStatus: 'BLOQUÉ' | 'EN COURS' | 'COMPLÉTÉ'): void {
    // 1. Préparer la commande pour le serveur
    const command = {
      type: 'UPDATE_STATUS_COMMAND',
      stepId: step.id,
      newStatus: newStatus
    };
    
    // 2. Envoyer la commande via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
      console.log(`Commande envoyée pour l'étape ${step.id} : ${newStatus}`);
    } else {
      console.error('WebSocket non connecté ou prêt. Impossible d\'envoyer la commande.');
    }
  }
  
  getStatusClass(status: string): string {
        switch (status) {
      case 'BLOQUÉ':
        return 'bloque';
      case 'EN COURS':
        return 'en-cours';
      case 'COMPLÉTÉ':
        return 'complete';
      default:
        return '';
    }
  }
}