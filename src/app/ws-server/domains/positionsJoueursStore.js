const { loadData, saveAndBroadcast } = require('../core/persistence');
const { FILES } = require('../core/config');

/** Positions des cartes sur le board joueurs partagé. Même format que PositionsStore. */
class PositionsJoueursStore {
    constructor(wss) {
        this.wss = wss;
        this.data = loadData(FILES.POSITIONS_JOUEURS, {});
    }

    getAll() {
        return this.data;
    }

    mettreAJourPosition(type, id, x, y) {
        if (!type || id === undefined || typeof x !== 'number' || typeof y !== 'number') {
            console.warn('Mise à jour de position joueur refusée : paramètres invalides.');
            return;
        }

        const cle = `${type}:${id}`;
        this.data[cle] = { x, y };
        this._sauvegarder();
    }

    supprimerPosition(type, id) {
        const cle = `${type}:${id}`;
        if (this.data[cle] !== undefined) {
            delete this.data[cle];
            this._sauvegarder();
        }
    }

    _sauvegarder() {
        saveAndBroadcast(this.wss, FILES.POSITIONS_JOUEURS, 'UPDATE_POSITIONS_JOUEURS', this.data);
    }
}

module.exports = { PositionsJoueursStore };