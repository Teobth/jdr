const { loadData } = require('../core/persistence');
const { FILES } = require('../core/config');

class AuthStore {
    constructor() {
        this.data = loadData(FILES.JOUEURS, []);
    }

    /**
     * Vérifie un PIN et renvoie les infos de connexion associées, ou null si invalide.
     * @param {string} pin - Le code saisi par le joueur.
     * @returns {{role: string, nomPersonnage: string|null}|null}
     */
    verifierPin(pin) {
        const entry = this.data.find(j => String(j.pin) === String(pin));
        if (!entry) return null;

        // Rétro-compatibilité : si "role" est absent, on déduit 'mj' ou 'joueur'
        const role = entry.role || (entry.nomPersonnage ? 'joueur' : 'mj');
        return {
            role,
            nomPersonnage: entry.nomPersonnage || null
        };
    }
}

module.exports = { AuthStore };