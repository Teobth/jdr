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

    /**
     * Crée un nouveau document vierge.
     * @param {{titre: string, contenu?: string, imageUrl?: string}} champs
     */
    creerDocument(champs) {
        if (!champs || !champs.titre || !champs.titre.trim()) {
            console.warn('Création de document refusée : titre requis.');
            return;
        }

        const nouvelId = this.data.length > 0
            ? Math.max(...this.data.map(d => d.id)) + 1
            : 1;

        const nouveauDocument = {
            id: nouvelId,
            titre: champs.titre.trim(),
            contenu: champs.contenu || '',
            accessible: false,
            imageUrl: champs.imageUrl || ''
        };

        this.data.push(nouveauDocument);
        console.log(`Document créé : "${nouveauDocument.titre}" (id ${nouvelId}).`);
        saveAndBroadcast(this.wss, FILES.DOCUMENTS, 'UPDATE_DOCUMENTS', this.data);
    }

    /** Supprime un document par son id. */
    supprimerDocument(id) {
        const tailleAvant = this.data.length;
        this.data = this.data.filter(d => d.id !== id);

        if (this.data.length === tailleAvant) {
            console.warn(`Suppression refusée : document ${id} non trouvé.`);
            return;
        }

        console.log(`Document ${id} supprimé.`);
        saveAndBroadcast(this.wss, FILES.DOCUMENTS, 'UPDATE_DOCUMENTS', this.data);
    }

    /** Met à jour uniquement le chemin de l'image d'un document existant. */
    modifierImage(id, imageUrl) {
        const document = this.data.find(d => d.id === id);
        if (!document) {
            console.warn(`Modification d'image refusée : document ${id} non trouvé.`);
            return;
        }

        document.imageUrl = imageUrl || '';
        console.log(`Image du document ${id} mise à jour.`);
        saveAndBroadcast(this.wss, FILES.DOCUMENTS, 'UPDATE_DOCUMENTS', this.data);
    }
}

module.exports = { DocumentsStore };