const fs = require('fs');
const WebSocket = require('ws');

/**
 * Tente de charger des données JSON depuis un fichier.
 * @param {string} filePath - Le chemin du fichier.
 * @param {*} defaultData - La valeur par défaut si le chargement échoue.
 * @returns {*} Les données chargées ou les données par défaut.
 */
function loadData(filePath, defaultData) {
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (error) {
        console.warn(`[WARN] Erreur chargement ${filePath}`, error.message);
        return defaultData;
    }
}

/**
 * Sauvegarde des données JSON sur le disque.
 * @param {string} filePath - Le chemin du fichier.
 * @param {*} data - Les données à sauvegarder.
 * @returns {boolean} true si la sauvegarde a réussi.
 */
function saveData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Erreur lors de la sauvegarde du fichier ${filePath}:`, error);
        return false;
    }
}

/**
 * Diffuse un message à tous les clients WebSocket connectés.
 * @param {WebSocket.Server} wss - Le serveur WebSocket.
 * @param {string} type - Le type de message (ex: 'UPDATE_SCENARIO').
 * @param {*} payload - Les données à envoyer.
 */
function broadcast(wss, type, payload) {
    const message = JSON.stringify({ type, payload });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

/**
 * Combine sauvegarde sur disque + diffusion, le pattern utilisé par
 * (presque) toutes les commandes qui modifient une donnée persistée.
 * @param {WebSocket.Server} wss
 * @param {string} filePath - Chemin du fichier à mettre à jour.
 * @param {string} updateType - Type de message à diffuser (ex: 'UPDATE_SCENARIO').
 * @param {*} data - Données à sauvegarder et diffuser.
 */
function saveAndBroadcast(wss, filePath, updateType, data) {
    const succes = saveData(filePath, data);
    if (succes) {
        console.log(`Données sauvegardées et diffusées: ${filePath} (${updateType})`);
        broadcast(wss, updateType, data);
    }
}

module.exports = {
    loadData,
    saveData,
    broadcast,
    saveAndBroadcast
};