const { loadData, broadcast } = require('../core/persistence');
const { FILES } = require('../core/config');

class LieuStore {
    constructor(wss) {
        this.wss = wss;
        // Les affiches elles-mêmes sont en lecture seule côté serveur (éditées à la main dans le JSON)
        this.affiches = loadData(FILES.AFFICHE, []);
        // L'ID actuellement affiché n'est volontairement pas persisté sur disque :
        // il repart à 1 à chaque redémarrage du serveur, comme dans la version d'origine.
        this.currentDisplayId = 1;
    }

    getAffiches() {
        return this.affiches;
    }

    getCurrentDisplayId() {
        return this.currentDisplayId;
    }

    updateDisplayId(newId) {
        if (typeof newId !== 'number') return;

        this.currentDisplayId = newId;
        broadcast(this.wss, 'UPDATE_DISPLAY_ID', { displayId: this.currentDisplayId });
    }
}

module.exports = { LieuStore };