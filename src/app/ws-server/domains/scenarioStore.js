const { loadData, saveAndBroadcast } = require('../core/persistence');
const { FILES } = require('../core/config');

class ScenarioStore {
    constructor(wss) {
        this.wss = wss;
        this.data = loadData(FILES.SCENARIO, []);
    }

    getAll() {
        return this.data;
    }

    updateStatus(stepId, newStatus) {
        const etape = this.data.find(s => s.id === stepId);
        if (!etape) {
            console.warn(`Étape de scénario avec ID ${stepId} non trouvée.`);
            return;
        }

        etape.status = newStatus;
        console.log(`Statut de l'étape ${stepId} changé à ${newStatus}.`);
        this._sauvegarder();
    }

    /**
     * Crée une nouvelle étape de scénario.
     * @param {{title: string, chapter: string, description?: string, status?: string, personnagesLies?: string[], documentsLies?: number[]}} champs
     */
    creerEtape(champs) {
        if (!champs || !champs.title || !champs.chapter) {
            console.warn('Création d\'étape refusée : titre et chapitre requis.');
            return;
        }

        const nouvelId = this.data.length > 0
            ? Math.max(...this.data.map(s => s.id)) + 1
            : 1;

        const nouvelleEtape = {
            id: nouvelId,
            chapter: champs.chapter,
            title: champs.title,
            summary: champs.summary || '',
            description: champs.description || '',
            status: champs.status || 'BLOQUÉ',
            personnagesLies: Array.isArray(champs.personnagesLies) ? champs.personnagesLies : [],
            documentsLies: Array.isArray(champs.documentsLies) ? champs.documentsLies : []
        };

        this.data.push(nouvelleEtape);
        console.log(`Étape créée : "${nouvelleEtape.title}" (id ${nouvelId}).`);
        this._sauvegarder();
    }

    /**
     * Modifie une étape existante. `champs` peut être un patch partiel
     * (seuls les champs fournis sont mis à jour).
     * @param {number} stepId
     * @param {Partial<{title: string, chapter: string, summary: string, description: string, status: string, personnagesLies: string[], documentsLies: number[]}>} champs
     */
    modifierEtape(stepId, champs) {
        const etape = this.data.find(s => s.id === stepId);
        if (!etape) {
            console.warn(`Modification refusée : étape ${stepId} non trouvée.`);
            return;
        }
        if (!champs) return;

        if (champs.title !== undefined) etape.title = champs.title;
        if (champs.chapter !== undefined) etape.chapter = champs.chapter;
        if (champs.summary !== undefined) etape.summary = champs.summary;
        if (champs.description !== undefined) etape.description = champs.description;
        if (champs.status !== undefined) etape.status = champs.status;
        if (Array.isArray(champs.personnagesLies)) etape.personnagesLies = champs.personnagesLies;
        if (Array.isArray(champs.documentsLies)) etape.documentsLies = champs.documentsLies;

        console.log(`Étape ${stepId} modifiée.`);
        this._sauvegarder();
    }

    /**
     * Supprime une étape de scénario.
     * @param {number} stepId
     */
    supprimerEtape(stepId) {
        const tailleAvant = this.data.length;
        this.data = this.data.filter(s => s.id !== stepId);

        if (this.data.length === tailleAvant) {
            console.warn(`Suppression refusée : étape ${stepId} non trouvée.`);
            return;
        }

        console.log(`Étape ${stepId} supprimée.`);
        this._sauvegarder();
    }

    _sauvegarder() {
        saveAndBroadcast(this.wss, FILES.SCENARIO, 'UPDATE_SCENARIO', this.data);
    }
}

module.exports = { ScenarioStore };