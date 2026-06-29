const WebSocket = require('ws');
const express = require('express');

const { WS_PORT, IMAGES_PORT, RACINE_DONNEES, dossier } = require('./core/config');
const { handleMessage } = require('./core/commandRouter');

const { ScenarioStore } = require('./domains/scenarioStore');
const { PersonnagesStore } = require('./domains/personnagesStore');
const { DocumentsStore } = require('./domains/documentsStore');
const { ActesStore } = require('./domains/actesStore');
const { AuthStore } = require('./domains/authStore');
const { LieuStore } = require('./domains/lieuStore');
const { CartesStore } = require('./domains/cartes/cartesStore');
const { LiensStore } = require('./domains/liensStore');
const { PositionsStore } = require('./domains/positionsStore');

// --- SERVEUR HTTP D'IMAGES ---

const app = express();
app.use('/images', express.static(RACINE_DONNEES));
app.listen(IMAGES_PORT, () => {
    console.log(`Serveur d'images sur le port ${IMAGES_PORT}. Le dossier utilisé est : ${dossier}`);
});

// --- SERVEUR WEBSOCKET ---

const wss = new WebSocket.Server({ port: WS_PORT }, () => {
    console.log(`Serveur WebSocket démarré sur le port ${WS_PORT}`);
    console.log(`Utilisez l'adresse : ws://localhost:${WS_PORT}`);
});

// Une store par domaine métier, toutes branchées sur le même wss pour la diffusion.
const stores = {
    scenario: new ScenarioStore(wss),
    personnages: new PersonnagesStore(wss),
    documents: new DocumentsStore(wss),
    actes: new ActesStore(wss),
    auth: new AuthStore(),
    lieu: new LieuStore(wss),
    cartes: new CartesStore(wss),
    liens: new LiensStore(wss),
    positions: new PositionsStore(wss)
};

/** Construit le payload INITIAL_STATE envoyé à chaque nouveau client. */
function getInitialState() {
    return {
        personnages: stores.personnages.getAll(),
        documents: stores.documents.getAll(),
        scenario: stores.scenario.getAll(),
        affiches: stores.lieu.getAffiches(),
        cartes: stores.cartes.getAll(),
        actesActifs: stores.actes.getAll(),
        displayId: stores.lieu.getCurrentDisplayId(),
        liens: stores.liens.getAll(),
        positions: stores.positions.getAll()
    };
}

wss.on('connection', (ws) => {
    console.log('Nouveau client connecté.');

    ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        payload: getInitialState()
    }));

    ws.on('message', (rawMessage) => handleMessage(rawMessage, stores, ws));

    ws.on('close', () => {
        console.log('Un client est déconnecté.');
    });
});