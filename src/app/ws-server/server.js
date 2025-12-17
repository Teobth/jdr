const WebSocket = require('ws');
const fs = require('fs');

// Le port que vous utiliserez pour la connexion WebSocket
const PORT = '3000'; 

// --- FICHIERS DE DONNÉES ---
const FILES = {
    PERSONNAGES: '../../assets/json/personnages.json',
    DOCUMENTS: '../../assets/json/documents.json', 
    SCENARIO: '../../assets/json/scenario.json',
};

// --- CLASSE DE GESTION DES DONNÉES (StateManager) ---

class StateManager {
    constructor(wss) {
        this.wss = wss; // Référence au serveur WebSocket pour la diffusion
        
        // Initialisation des données (Tentative de chargement depuis les fichiers)
        this.personnagesData = this.loadData(FILES.PERSONNAGES, []);
        this.documentsData = this.loadData(FILES.DOCUMENTS, []);
        this.scenarioData = this.loadData(FILES.SCENARIO, []);
        this.currentDisplayId = 1;
    }

    // --- Fonctions d'Initialisation et Persistance ---

    /**
     * Tente de charger les données à partir d'un fichier JSON.
     * @param {string} filePath - Le chemin du fichier.
     * @param {*} defaultData - La valeur par défaut si le chargement échoue.
     * @returns {*} Les données chargées ou les données par défaut.
     */
    loadData(filePath, defaultData) {
        try {
            return require(filePath);
        } catch (error) {
            if (error.code === 'MODULE_NOT_FOUND' || error instanceof SyntaxError) {
                console.warn(`[WARN] Fichier non trouvé ou invalide: ${filePath}. Initialisation avec données par défaut.`);
                return defaultData;
            }
            throw error; // Renvoyer les autres erreurs
        }
    }

    /**
     * Sauvegarde un jeu de données sur le disque et diffuse la mise à jour.
     * @param {string} fileKey - Clé du fichier (ex: 'SCENARIO').
     * @param {string} updateType - Type de message (ex: 'UPDATE_SCENARIO').
     * @param {any} data - Le tableau de données à sauvegarder.
     */
    saveAndBroadcast(fileKey, updateType, data) {
        const filePath = FILES[fileKey];
        try {
            const jsonString = JSON.stringify(data, null, 2);
            fs.writeFileSync(filePath, jsonString); 
            console.log(`Données sauvegardées et diffusées: ${filePath} (${updateType})`);
            
            // Diffusion après la sauvegarde réussie
            const message = JSON.stringify({
                type: updateType,
                payload: data
            });

            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });

        } catch (error) {
            console.error(`Erreur lors de la sauvegarde du fichier ${filePath}:`, error);
        }
    }

    broadcastDisplayUpdate() {
        const message = JSON.stringify({
            type: 'UPDATE_DISPLAY_ID',
            displayId: this.currentDisplayId
        });

        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    updateDisplayId(newId) {
        if (typeof newId === 'number') {
            this.currentDisplayId = newId;
            this.broadcastDisplayUpdate();
        } else {
            console.warn(`Tentative de définir un ID d'affichage non numérique: ${newId}`);
        }
    }
    
    // --- Commandes SCÉNARIO ---
    updateScenarioStatus(stepId, newStatus) {
        const index = this.scenarioData.findIndex(s => s.id === stepId);
        if (index !== -1) {
            this.scenarioData[index].status = newStatus;
            console.log(`Statut de l'étape ${stepId} changé à ${newStatus}.`);
            
            // Utilisation de la méthode générique
            this.saveAndBroadcast('SCENARIO', 'UPDATE_SCENARIO', this.scenarioData); 
        } else {
            console.warn(`Étape de scénario avec ID ${stepId} non trouvée.`);
        }
    }

    // --- Commandes Personnages ---
    toggleRencontre(nom) {
        const index = this.personnagesData.findIndex(p => p.nom === nom);
        if (index !== -1) {
            this.personnagesData[index].rencontre = !this.personnagesData[index].rencontre;
            console.log(`Statut de rencontre de ${nom} changé.`);
            
            this.saveAndBroadcast('PERSONNAGES', 'UPDATE_PERSONNAGES', this.personnagesData);
        }
    }

    toggleSecret(personnageNom, secretCle) {
        const perso = this.personnagesData.find(p => p.nom === personnageNom);

        if (perso && perso.secrets) {
            const secret = perso.secrets.find(s => s.cle === secretCle);
            if (secret) {
                secret.debloque = !secret.debloque;
                console.log(`Secret "${secretCle}" de ${personnageNom} basculé: ${secret.debloque}`);
                
                this.saveAndBroadcast('PERSONNAGES', 'UPDATE_PERSONNAGES', this.personnagesData);
            }
        }
    }

    // --- Commandes Documents ---
    toggleAcces(titre) {
        const index = this.documentsData.findIndex(d => d.titre === titre);
        if (index !== -1) {
            this.documentsData[index].accessible = !this.documentsData[index].accessible;
            console.log(`Statut d'accessibilité de ${titre} basculé: ${this.documentsData[index].accessible}.`);
            
            this.saveAndBroadcast('DOCUMENTS', 'UPDATE_DOCUMENTS', this.documentsData); 
        }
    }
    
    // --- État Initial pour un Nouveau Client ---
    getInitialState() {
        return {
            personnages: this.personnagesData,
            documents: this.documentsData,
            scenario: this.scenarioData,
            displayId: this.currentDisplayId
        };
    }
}


// --- DÉMARRAGE DU SERVEUR ---

// Création du serveur WebSocket
const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`Serveur WebSocket démarré sur le port ${PORT}`);
    console.log(`Utilisez l'adresse : ws://localhost:${PORT}`);
});

// Création de l'unique instance du gestionnaire d'état
const stateManager = new StateManager(wss);


// --- Gestion des Connexions ---
wss.on('connection', (ws) => {
    console.log('Nouveau client connecté.');

    // 1. Envoyer l'état INITIAL des tableaux de données
    ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        payload: stateManager.getInitialState() // Utilisation de la méthode de la classe
    }));  
  
    // 2. Écouter les messages du client (Commandes)
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            
            // Dispatch des commandes vers la classe StateManager
            switch (data.type) {
                case 'UPDATE_STATUS_COMMAND':
                    stateManager.updateScenarioStatus(data.stepId, data.newStatus);
                    break;

                case 'TOGGLE_RENCONTRE_COMMAND':
                    stateManager.toggleRencontre(data.personnageNom); 
                    break;
                    
                case 'TOGGLE_SECRET_COMMAND':
                    stateManager.toggleSecret(data.personnageNom, data.secretCle);
                    break;
                
                case 'TOGGLE_ACCES_COMMAND':
                    stateManager.toggleAcces(data.documentTitre); 
                    break;

                case 'UPDATE_DISPLAY_ID_COMMAND': 
                    stateManager.updateDisplayId(data.displayId);
                    break;
                    
                default:
                    console.warn(`Type de commande inconnu: ${data.type}`);
            }
        } catch (error) {
            console.error('Erreur lors du traitement du message client:', error);
        }
    });

    // 3. Gérer la déconnexion
    ws.on('close', () => {
        console.log('Un client est déconnecté.');
    });
});