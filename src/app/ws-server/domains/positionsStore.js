const { loadData, saveAndBroadcast } = require('../core/persistence');
const { FILES } = require('../core/config');

/**
 * Stocke uniquement les positions (x, y) des cartes du murder board, indexées
 * par clé "type:id" (ex: "personnage:Joseph Janvier", "document:3"). Séparé
 * volontairement des fiches personnages/documents pour ne pas les polluer
 * avec une donnée purement visuelle.
 */
class PositionsStore {
    constructor(wss) {
        this.wss = wss;
        // Format : { "personnage:Nom": { x, y }, "document:3": { x, y }, ... }
        this.data = loadData(FILES.POSITIONS, {});
    }

    getAll() {
        return this.data;
    }

    /** Met à jour (ou crée) la position d'une carte donnée. */
    mettreAJourPosition(type, id, x, y) {
        if (!type || id === undefined || typeof x !== 'number' || typeof y !== 'number') {
            console.warn('Mise à jour de position refusée : paramètres invalides.');
            return;
        }

        const cle = `${type}:${id}`;
        this.data[cle] = { x, y };
        this._sauvegarder();
    }

    /** Supprime la position enregistrée d'une entité (ex: après suppression du personnage/document). */
    supprimerPosition(type, id) {
        const cle = `${type}:${id}`;
        if (this.data[cle] !== undefined) {
            delete this.data[cle];
            this._sauvegarder();
        }
    }

    _sauvegarder() {
        saveAndBroadcast(this.wss, FILES.POSITIONS, 'UPDATE_POSITIONS', this.data);
    }
}

module.exports = { PositionsStore };