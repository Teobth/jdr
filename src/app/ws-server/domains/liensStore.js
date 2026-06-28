const { loadData, saveAndBroadcast } = require('../core/persistence');
const { FILES } = require('../core/config');

class LiensStore {
    constructor(wss) {
        this.wss = wss;
        this.data = loadData(FILES.LIENS, []);
    }

    getAll() {
        return this.data;
    }

    /**
     * Crée un lien entre deux entités (personnage ou document).
     * @param {{sourceType: 'personnage'|'document', sourceId: string|number, cibleType: 'personnage'|'document', cibleId: string|number, note?: string}} champs
     */
    creerLien(champs) {
        if (!champs || !champs.sourceType || champs.sourceId === undefined || !champs.cibleType || champs.cibleId === undefined) {
            console.warn('Création de lien refusée : champs incomplets.');
            return;
        }

        // Évite les doublons et les liens vers soi-même.
        const memeEntite = champs.sourceType === champs.cibleType && String(champs.sourceId) === String(champs.cibleId);
        if (memeEntite) {
            console.warn('Création de lien refusée : une entité ne peut pas être liée à elle-même.');
            return;
        }

        const existeDeja = this.data.some(l =>
            this._memesPaires(l, champs.sourceType, champs.sourceId, champs.cibleType, champs.cibleId)
        );
        if (existeDeja) {
            console.warn('Lien déjà existant entre ces deux entités, création ignorée.');
            return;
        }

        const nouvelId = this.data.length > 0
            ? Math.max(...this.data.map(l => l.id)) + 1
            : 1;

        this.data.push({
            id: nouvelId,
            sourceType: champs.sourceType,
            sourceId: champs.sourceId,
            cibleType: champs.cibleType,
            cibleId: champs.cibleId,
            note: champs.note || ''
        });

        console.log(`Lien créé entre ${champs.sourceType}:${champs.sourceId} et ${champs.cibleType}:${champs.cibleId}.`);
        this._sauvegarder();
    }

    /** Met à jour la note d'un lien existant. */
    modifierNote(lienId, note) {
        const lien = this.data.find(l => l.id === lienId);
        if (!lien) {
            console.warn(`Modification refusée : lien ${lienId} non trouvé.`);
            return;
        }
        lien.note = note || '';
        this._sauvegarder();
    }

    /** Supprime un lien par son id. */
    supprimerLien(lienId) {
        const tailleAvant = this.data.length;
        this.data = this.data.filter(l => l.id !== lienId);

        if (this.data.length === tailleAvant) {
            console.warn(`Suppression refusée : lien ${lienId} non trouvé.`);
            return;
        }

        console.log(`Lien ${lienId} supprimé.`);
        this._sauvegarder();
    }

    /** Supprime tous les liens pointant vers une entité supprimée (personnage ou document). */
    supprimerLiensDe(type, id) {
        const tailleAvant = this.data.length;
        this.data = this.data.filter(l =>
            !((l.sourceType === type && String(l.sourceId) === String(id)) ||
              (l.cibleType === type && String(l.cibleId) === String(id)))
        );
        if (this.data.length !== tailleAvant) {
            this._sauvegarder();
        }
    }

    _memesPaires(lien, typeA, idA, typeB, idB) {
        const pairesEgales = (lien.sourceType === typeA && String(lien.sourceId) === String(idA) &&
                               lien.cibleType === typeB && String(lien.cibleId) === String(idB));
        const pairesEgaleesInversees = (lien.sourceType === typeB && String(lien.sourceId) === String(idB) &&
                                         lien.cibleType === typeA && String(lien.cibleId) === String(idA));
        return pairesEgales || pairesEgaleesInversees;
    }

    _sauvegarder() {
        saveAndBroadcast(this.wss, FILES.LIENS, 'UPDATE_LIENS', this.data);
    }
}

module.exports = { LiensStore };