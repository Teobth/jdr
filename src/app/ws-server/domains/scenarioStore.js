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
        saveAndBroadcast(this.wss, FILES.SCENARIO, 'UPDATE_SCENARIO', this.data);
    }
}

module.exports = { ScenarioStore };