const { loadData, saveAndBroadcast } = require('../core/persistence');
const { FILES } = require('../core/config');

class ActesStore {
    constructor(wss) {
        this.wss = wss;
        this.data = loadData(FILES.ACTES, []);
    }

    getAll() {
        return this.data;
    }

    /**
     * Bascule la visibilité d'un acte pour les joueurs : ajouté à la liste
     * s'il est absent, retiré s'il y est déjà.
     */
    toggleActif(acte) {
        if (typeof acte !== 'number') return;

        const index = this.data.indexOf(acte);
        if (index !== -1) {
            this.data.splice(index, 1);
            console.log(`Acte ${acte} masqué pour les joueurs.`);
        } else {
            this.data.push(acte);
            console.log(`Acte ${acte} rendu visible pour les joueurs.`);
        }

        saveAndBroadcast(this.wss, FILES.ACTES, 'UPDATE_ACTES', this.data);
    }
}

module.exports = { ActesStore };