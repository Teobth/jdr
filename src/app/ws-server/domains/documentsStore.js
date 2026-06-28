const { loadData, saveAndBroadcast } = require('../core/persistence');
const { FILES } = require('../core/config');

class DocumentsStore {
    constructor(wss) {
        this.wss = wss;
        this.data = loadData(FILES.DOCUMENTS, []);
    }

    getAll() {
        return this.data;
    }

    toggleAcces(titre) {
        const document = this.data.find(d => d.titre === titre);
        if (!document) return;

        document.accessible = !document.accessible;
        console.log(`Statut d'accessibilité de ${titre} basculé: ${document.accessible}.`);
        saveAndBroadcast(this.wss, FILES.DOCUMENTS, 'UPDATE_DOCUMENTS', this.data);
    }
}

module.exports = { DocumentsStore };