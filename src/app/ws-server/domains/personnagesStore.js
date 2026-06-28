const { loadData, saveAndBroadcast } = require('../core/persistence');
const { FILES } = require('../core/config');

class PersonnagesStore {
    constructor(wss) {
        this.wss = wss;
        this.data = loadData(FILES.PERSONNAGES, []);
    }

    getAll() {
        return this.data;
    }

    toggleRencontre(nom) {
        const personnage = this.data.find(p => p.nom === nom);
        if (!personnage) return;

        personnage.rencontre = !personnage.rencontre;
        console.log(`Statut de rencontre de ${nom} changé.`);
        saveAndBroadcast(this.wss, FILES.PERSONNAGES, 'UPDATE_PERSONNAGES', this.data);
    }

    toggleMort(nom) {
        const personnage = this.data.find(p => p.nom === nom);
        if (!personnage) return;

        personnage.mort = !personnage.mort;
        console.log(`Statut de mort de ${nom} changé.`);
        saveAndBroadcast(this.wss, FILES.PERSONNAGES, 'UPDATE_PERSONNAGES', this.data);
    }

    toggleSecret(personnageNom, secretCle) {
        const personnage = this.data.find(p => p.nom === personnageNom);
        if (!personnage || !personnage.secrets) return;

        const secret = personnage.secrets.find(s => s.cle === secretCle);
        if (!secret) return;

        secret.debloque = !secret.debloque;
        console.log(`Secret "${secretCle}" de ${personnageNom} basculé: ${secret.debloque}`);
        saveAndBroadcast(this.wss, FILES.PERSONNAGES, 'UPDATE_PERSONNAGES', this.data);
    }
}

module.exports = { PersonnagesStore };