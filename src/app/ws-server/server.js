const WebSocket = require('ws');
const fs = require('fs');

// Le port que vous utiliserez pour la connexion WebSocket
const PORT = '3000'; 

// --- FICHIERS DE DONNÉES ---
const PERSONNAGES_FILE = './personnages.json';
const DOCUMENTS_FILE = './documents.json'; 
const SCENARIO_FILE = './scenario.json';

// --- STOCKAGE CENTRALISÉ (Sources de Vérité) ---
let personnagesData = require(PERSONNAGES_FILE);
let documentsData = require(DOCUMENTS_FILE); 
let scenarioData = require(SCENARIO_FILE);

// Création du serveur WebSocket
const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`Serveur WebSocket démarré sur le port ${PORT}`);
    console.log(`Utilisez l'adresse : ws://localhost:${PORT}`);
});

// --- Fonctions Utilitaires Générales ---

// Sauvegarde des données du SCÉNARIO
const saveScenarioData = () => {
    try {
        const data = JSON.stringify(scenarioData, null, 2);
        fs.writeFileSync(SCENARIO_FILE, data); 
        console.log(`Données sauvegardées sur le disque : ${SCENARIO_FILE}`);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du fichier SCENARIO JSON:', error);
    }
};

const saveDocumentsData = () => {
    try {
        const data = JSON.stringify(documentsData, null, 2);
        fs.writeFileSync(DOCUMENTS_FILE, data); 
        console.log(`Données sauvegardées sur le disque : ${DOCUMENTS_FILE}`);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du fichier DOCUMENTS JSON:', error);
    }
};

const savePersonnagesData = () => {
    try {
        const data = JSON.stringify(personnagesData, null, 2);
        fs.writeFileSync(PERSONNAGES_FILE, data); 
        console.log(`Données sauvegardées sur le disque : ${PERSONNAGES_FILE}`);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du fichier PERSONNAGES JSON:', error);
    }
};

// Fonction pour diffuser le tableau de personnages à tous les clients
const broadcastPersonnages = () => {
    const message = JSON.stringify({
        type: 'UPDATE_PERSONNAGES',
        payload: personnagesData
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

// Fonction pour diffuser le tableau de documents à tous les clients
const broadcastDocuments = () => {
    const message = JSON.stringify({
        type: 'UPDATE_DOCUMENTS',
        payload: documentsData 
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

// Fonction pour diffuser le tableau de scénario à tous les clients
const broadcastScenario = () => {
    const message = JSON.stringify({
        type: 'UPDATE_SCENARIO',
        payload: scenarioData
    });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};


// --- Commandes SCÉNARIO ---
const updateScenarioStatus = (stepId, newStatus) => {
    const index = scenarioData.findIndex(s => s.id === stepId);
    if (index !== -1) {
        scenarioData[index].status = newStatus;
        console.log(`Statut de l'étape ${stepId} changé à ${newStatus}.`);
        
        saveScenarioData(); // Sauvegarde sur le disque
        broadcastScenario(); // Diffusion aux clients
    } else {
        console.warn(`Étape de scénario avec ID ${stepId} non trouvée.`);
    }
};


// --- Commandes Personnages ---
const toggleRencontre = (nom) => {
    const index = personnagesData.findIndex(p => p.nom === nom);
    if (index !== -1) {
        personnagesData[index].rencontre = !personnagesData[index].rencontre;
        console.log(`Statut de rencontre de ${nom} changé.`);
        
        savePersonnagesData();
        broadcastPersonnages();
    }
};

const toggleSecret = (personnageNom, secretCle) => {
    const perso = personnagesData.find(p => p.nom === personnageNom);

    if (perso && perso.secrets) {
        const secret = perso.secrets.find(s => s.cle === secretCle);
        if (secret) {
            secret.debloque = !secret.debloque;
            console.log(`Secret "${secretCle}" de ${personnageNom} basculé: ${secret.debloque}`);
            
            savePersonnagesData();
            broadcastPersonnages();
        }
    }
};

// --- Commandes Documents ---
const toggleAcces = (titre) => {
    const index = documentsData.findIndex(d => d.titre === titre);
    if (index !== -1) {
        documentsData[index].accessible = !documentsData[index].accessible;
        console.log(`Statut d'accessibilité de ${titre} basculé: ${documentsData[index].accessible}.`);
        
        saveDocumentsData(); 
        broadcastDocuments(); 
    }
};


// --- Gestion des Connexions ---
wss.on('connection', (ws) => {
    console.log('Nouveau client connecté.');

    // 1. Envoyer l'état INITIAL des tableaux de données
    ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        payload: {
            personnages: personnagesData,
            documents: documentsData,
            scenario: scenarioData
        }
    }));  
  
    // 2. Écouter les messages du client (Commandes)
    ws.on('message', (message) => {
        const data = JSON.parse(message.toString());
        
        // Commandes Scénario
        if (data.type === 'UPDATE_STATUS_COMMAND') {
            updateScenarioStatus(data.stepId, data.newStatus);
        }

        // Commandes Personnages
        else if (data.type === 'TOGGLE_RENCONTRE_COMMAND') {
            toggleRencontre(data.personnageNom); 
        } else if (data.type === 'TOGGLE_SECRET_COMMAND') {
            toggleSecret(data.personnageNom, data.secretCle);
        }
        
        // Commandes Documents
        else if (data.type === 'TOGGLE_ACCES_COMMAND') {
            toggleAcces(data.documentTitre); 
        }
    });

    // 3. Gérer la déconnexion
    ws.on('close', () => {
        console.log('Un client est déconnecté.');
    });
});

// Pour s'assurer que le script ne plante pas si les fichiers JSON n'existent pas
process.on('uncaughtException', (err) => {
    if (err.code === 'MODULE_NOT_FOUND') {
        console.error(`Erreur: Un des fichiers JSON n'a pas été trouvé. Créez les fichiers vides suivants: ${PERSONNAGES_FILE}, ${DOCUMENTS_FILE}, ${SCENARIO_FILE}`);
        console.error('Démarrage sans recharger les fichiers. Le contenu actuel sera utilisé.');
    } else {
        throw err;
    }
});