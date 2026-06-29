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

    /** Le MJ envoie la fiche complète (ou un patch partiel) pour un personnage donné. */
    mettreAJourFiche(personnageNom, fiche) {
        const personnage = this.data.find(p => p.nom === personnageNom);
        if (!personnage) {
            console.warn(`Mise à jour de fiche refusée : personnage "${personnageNom}" non trouvé.`);
            return;
        }
        if (!fiche) return;

        personnage.fiche = fiche;
        console.log(`Fiche complète mise à jour pour ${personnageNom}.`);
        saveAndBroadcast(this.wss, FILES.PERSONNAGES, 'UPDATE_PERSONNAGES', this.data);
    }

    /**
     * Crée un nouveau personnage vierge.
     * @param {{nom: string, age?: number, profession?: string, portraitUrl?: string}} champs
     */
    creerPersonnage(champs) {
        if (!champs || !champs.nom || !champs.nom.trim()) {
            console.warn('Création de personnage refusée : nom requis.');
            return;
        }

        const nomNormalise = champs.nom.trim();
        const existeDeja = this.data.some(p => p.nom.toLowerCase() === nomNormalise.toLowerCase());
        if (existeDeja) {
            console.warn(`Création refusée : un personnage nommé "${nomNormalise}" existe déjà.`);
            return;
        }

        const nouveauPersonnage = {
            nom: nomNormalise,
            age: champs.age ?? 0,
            profession: champs.profession || '',
            rencontre: false,
            mort: false,
            portraitUrl: champs.portraitUrl || '',
            secrets: []
        };

        this.data.push(nouveauPersonnage);
        console.log(`Personnage créé : "${nomNormalise}".`);
        saveAndBroadcast(this.wss, FILES.PERSONNAGES, 'UPDATE_PERSONNAGES', this.data);
    }

    /** Supprime un personnage par son nom. */
    supprimerPersonnage(nom) {
        const tailleAvant = this.data.length;
        this.data = this.data.filter(p => p.nom !== nom);

        if (this.data.length === tailleAvant) {
            console.warn(`Suppression refusée : personnage "${nom}" non trouvé.`);
            return;
        }

        console.log(`Personnage "${nom}" supprimé.`);
        saveAndBroadcast(this.wss, FILES.PERSONNAGES, 'UPDATE_PERSONNAGES', this.data);
    }

    /** Met à jour uniquement le chemin du portrait d'un personnage existant. */
    modifierPortrait(nom, portraitUrl) {
        const personnage = this.data.find(p => p.nom === nom);
        if (!personnage) {
            console.warn(`Modification de portrait refusée : personnage "${nom}" non trouvé.`);
            return;
        }

        personnage.portraitUrl = portraitUrl || '';
        console.log(`Portrait de "${nom}" mis à jour.`);
        saveAndBroadcast(this.wss, FILES.PERSONNAGES, 'UPDATE_PERSONNAGES', this.data);
    }
}

module.exports = { PersonnagesStore };