const { loadData, saveAndBroadcast } = require('../../core/persistence');
const { FILES } = require('../../core/config');
const geo = require('./hexGeometry');

class CartesStore {
    constructor(wss) {
        this.wss = wss;
        this.data = loadData(FILES.CARTES, []);
    }

    getAll() {
        return this.data;
    }

    /** Renvoie la carte actuellement active (visible des joueurs), ou null. */
    getCarteActive() {
        return this.data.find(c => c.active) || null;
    }

    /**
     * Déplacement d'un joueur : ne peut bouger que son propre pion, d'une case
     * adjacente, et seulement si la case cible est libre, dans la grille, et
     * qu'aucun mur ne bloque le passage.
     */
    deplacerPionJoueur(nomPersonnage, qCible, rCible) {
        const carte = this.getCarteActive();
        if (!carte) {
            console.warn('Aucune carte active pour le déplacement.');
            return;
        }

        const pion = carte.pions.find(p => p.nomPersonnage === nomPersonnage);
        if (!pion) {
            console.warn(`Pion introuvable pour ${nomPersonnage}.`);
            return;
        }

        if (!geo.estDansLaGrille(qCible, rCible, carte.rayon)) {
            console.warn('Case cible hors de la grille.');
            return;
        }

        const estAdjacente = geo.getVoisins(pion.q, pion.r).some(v => v.q === qCible && v.r === rCible);
        if (!estAdjacente) {
            console.warn(`Déplacement refusé pour ${nomPersonnage} : case non adjacente.`);
            return;
        }

        if (geo.existeMurEntre(carte, pion.q, pion.r, qCible, rCible)) {
            console.warn(`Déplacement refusé pour ${nomPersonnage} : un mur bloque le passage.`);
            return;
        }

        const occupee = carte.pions.some(p => p.q === qCible && p.r === rCible);
        if (occupee) {
            console.warn('Case cible déjà occupée par un autre pion.');
            return;
        }

        pion.q = qCible;
        pion.r = rCible;
        this._sauvegarder();
    }

    /**
     * Déplacement libre par le MJ : aucune contrainte d'adjacence ni de mur,
     * mais la case doit rester dans la grille et libre.
     */
    mjDeplacerPion(carteId, nomPersonnage, qCible, rCible) {
        const carte = this.data.find(c => c.id === carteId);
        if (!carte) return;

        const pion = carte.pions.find(p => p.nomPersonnage === nomPersonnage);
        if (!pion) return;

        if (!geo.estDansLaGrille(qCible, rCible, carte.rayon)) {
            console.warn('Case cible hors de la grille (MJ).');
            return;
        }

        const occupee = carte.pions.some(p => p.q === qCible && p.r === rCible && p.nomPersonnage !== nomPersonnage);
        if (occupee) {
            console.warn('Case cible déjà occupée (MJ).');
            return;
        }

        pion.q = qCible;
        pion.r = rCible;
        this._sauvegarder();
    }

    /** Ajoute un pion sur une carte donnée, à une position donnée (par défaut le centre). */
    mjAjouterPion(carteId, nomPersonnage, q = 0, r = 0) {
        const carte = this.data.find(c => c.id === carteId);
        if (!carte) return;

        if (carte.pions.some(p => p.nomPersonnage === nomPersonnage)) {
            console.warn(`${nomPersonnage} a déjà un pion sur cette carte.`);
            return;
        }

        if (carte.pions.some(p => p.q === q && p.r === r)) {
            console.warn('Case de départ déjà occupée, pion non ajouté.');
            return;
        }

        carte.pions.push({ nomPersonnage, q, r });
        this._sauvegarder();
    }

    /** Retire le pion d'un personnage sur une carte donnée. */
    mjRetirerPion(carteId, nomPersonnage) {
        const carte = this.data.find(c => c.id === carteId);
        if (!carte) return;

        carte.pions = carte.pions.filter(p => p.nomPersonnage !== nomPersonnage);
        this._sauvegarder();
    }

    /** Crée une nouvelle carte nommée avec un rayon donné. */
    mjCreerCarte(nom, rayon) {
        const nouvelId = this.data.length > 0
            ? Math.max(...this.data.map(c => c.id)) + 1
            : 1;

        this.data.push({
            id: nouvelId,
            nom,
            rayon,
            active: false,
            pions: [],
            decors: [],
            murs: []
        });
        this._sauvegarder();
    }

    /** Définit la carte active (visible des joueurs) ; désactive les autres. */
    mjActiverCarte(carteId) {
        this.data.forEach(c => { c.active = (c.id === carteId); });
        this._sauvegarder();
    }

    /** Supprime une carte. */
    mjSupprimerCarte(carteId) {
        this.data = this.data.filter(c => c.id !== carteId);
        this._sauvegarder();
    }

    /**
     * Pose ou retire un décor sur une case d'une carte donnée.
     * Si type est null/undefined, le décor de la case est supprimé.
     */
    mjPeindreDecor(carteId, q, r, type) {
        const carte = this.data.find(c => c.id === carteId);
        if (!carte) return;

        if (!carte.decors) carte.decors = [];

        if (!geo.estDansLaGrille(q, r, carte.rayon)) {
            console.warn('Case hors de la grille, décor non posé.');
            return;
        }

        const index = carte.decors.findIndex(d => d.q === q && d.r === r);

        if (!type) {
            if (index !== -1) carte.decors.splice(index, 1);
        } else if (index !== -1) {
            carte.decors[index].type = type;
        } else {
            carte.decors.push({ q, r, type });
        }

        this._sauvegarder();
    }

    /**
     * Bascule un mur sur le côté `cote` (0-5) de la case (q, r) :
     * l'ajoute s'il n'existe pas, le retire s'il existe déjà.
     */
    mjToggleMur(carteId, q, r, cote) {
        const carte = this.data.find(c => c.id === carteId);
        if (!carte) return;

        if (!carte.murs) carte.murs = [];

        if (!geo.estDansLaGrille(q, r, carte.rayon)) {
            console.warn('Case hors de la grille, mur non posé.');
            return;
        }

        const index = carte.murs.findIndex(m => m.q === q && m.r === r && m.cote === cote);
        if (index !== -1) {
            carte.murs.splice(index, 1);
        } else {
            carte.murs.push({ q, r, cote });
        }

        this._sauvegarder();
    }

    _sauvegarder() {
        saveAndBroadcast(this.wss, FILES.CARTES, 'UPDATE_CARTES', this.data);
    }
}

module.exports = { CartesStore };