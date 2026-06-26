const WebSocket = require('ws');
const fs = require('fs');

const express = require('express');
const app = express();

// Le port que vous utiliserez pour la connexion WebSocket
const PORT = '3000'; 

const histoire = 2;
let dossier = '';
switch (histoire) {
    case 1:
        dossier = 'Par cinq mètres de fond';
        break;
    case 2:
        dossier = 'Les maudits';
        break;
    default:
        dossier = 'Les maudits';
}

const photosPath = '/home/teo/Documents/JDR/Scénar.json/' + dossier;
app.use('/images', express.static(photosPath));
let port = 3000 + histoire;
app.listen(port, () => console.log("Serveur d'images sur le port " + port + ". Le dossier utilisé est : " + dossier));

// --- FICHIERS DE DONNÉES ---
const FILES = {
    PERSONNAGES: '/home/teo/Documents/JDR/Scénar.json/' + dossier + '/personnages.json',
    DOCUMENTS: '/home/teo/Documents/JDR/Scénar.json/' + dossier + '/documents.json', 
    SCENARIO: '/home/teo/Documents/JDR/Scénar.json/' + dossier + '/scenario.json',
    AFFICHE: '/home/teo/Documents/JDR/Scénar.json/' + dossier + '/affiche.json',
    JOUEURS: '/home/teo/Documents/JDR/Scénar.json/' + dossier + '/joueurs.json',
    CARTES: '/home/teo/Documents/JDR/Scénar.json/' + dossier + '/cartes.json'
};

// --- CLASSE DE GESTION DES DONNÉES (StateManager) ---

class StateManager {
    constructor(wss) {
        this.wss = wss; // Référence au serveur WebSocket pour la diffusion
        
        // Initialisation des données (Tentative de chargement depuis les fichiers)
        this.personnagesData = this.loadData(FILES.PERSONNAGES, []);
        this.documentsData = this.loadData(FILES.DOCUMENTS, []);
        this.scenarioData = this.loadData(FILES.SCENARIO, []);
        this.affichesData = this.loadData(FILES.AFFICHE, []);
        this.joueursData = this.loadData(FILES.JOUEURS, []);
        this.cartesData = this.loadData(FILES.CARTES, []);
        this.currentDisplayId = 1;
    }

    // --- Fonctions d'Initialisation et Persistance ---

    /**
     * Tente de charger les données à partir d'un fichier JSON.
     * @param {string} filePath - Le chemin du fichier.
     * @param {*} defaultData - La valeur par défaut si le chargement échoue.
     * @returns {*} Les données chargées ou les données par défaut.
     */
    loadData(filePath, defaultData) {
        try {
            const raw = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(raw);
        } catch (error) {
            console.warn(`[WARN] Erreur chargement ${filePath}`, error);
            return defaultData;
        }
    }

    /**
     * Sauvegarde un jeu de données sur le disque et diffuse la mise à jour.
     * @param {string} fileKey - Clé du fichier (ex: 'SCENARIO').
     * @param {string} updateType - Type de message (ex: 'UPDATE_SCENARIO').
     * @param {any} data - Le tableau de données à sauvegarder.
     */
    saveAndBroadcast(fileKey, updateType, data) {
        const filePath = FILES[fileKey];
        try {
            const jsonString = JSON.stringify(data, null, 2);
            fs.writeFileSync(filePath, jsonString); 
            console.log(`Données sauvegardées et diffusées: ${filePath} (${updateType})`);
            
            // Diffusion après la sauvegarde réussie
            const message = JSON.stringify({
                type: updateType,
                payload: data
            });

            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });

        } catch (error) {
            console.error(`Erreur lors de la sauvegarde du fichier ${filePath}:`, error);
        }
    }

    broadcastDisplayUpdate() {
        const message = JSON.stringify({
            type: 'UPDATE_DISPLAY_ID',
            payload: { displayId: this.currentDisplayId }
        });

        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    updateDisplayId(newId) {
        if (typeof newId === 'number') {
            this.currentDisplayId = newId;
            this.broadcastDisplayUpdate();
        }
    }
    
    // --- Commandes SCÉNARIO ---
    updateScenarioStatus(stepId, newStatus) {
        const index = this.scenarioData.findIndex(s => s.id === stepId);
        if (index !== -1) {
            this.scenarioData[index].status = newStatus;
            console.log(`Statut de l'étape ${stepId} changé à ${newStatus}.`);
            
            // Utilisation de la méthode générique
            this.saveAndBroadcast('SCENARIO', 'UPDATE_SCENARIO', this.scenarioData); 
        } else {
            console.warn(`Étape de scénario avec ID ${stepId} non trouvée.`);
        }
    }

    // --- Commandes Personnages ---
    toggleRencontre(nom) {
        const index = this.personnagesData.findIndex(p => p.nom === nom);
        if (index !== -1) {
            this.personnagesData[index].rencontre = !this.personnagesData[index].rencontre;
            console.log(`Statut de rencontre de ${nom} changé.`);
            
            this.saveAndBroadcast('PERSONNAGES', 'UPDATE_PERSONNAGES', this.personnagesData);
        }
    }

    toggleMort(nom) {
        const index = this.personnagesData.findIndex(p => p.nom === nom);
        if (index !== -1) {
            this.personnagesData[index].mort = !this.personnagesData[index].mort;
            console.log(`Statut de mort de ${nom} changé.`);
            
            this.saveAndBroadcast('PERSONNAGES', 'UPDATE_PERSONNAGES', this.personnagesData);
        }
    }

    toggleSecret(personnageNom, secretCle) {
        const perso = this.personnagesData.find(p => p.nom === personnageNom);

        if (perso && perso.secrets) {
            const secret = perso.secrets.find(s => s.cle === secretCle);
            if (secret) {
                secret.debloque = !secret.debloque;
                console.log(`Secret "${secretCle}" de ${personnageNom} basculé: ${secret.debloque}`);
                
                this.saveAndBroadcast('PERSONNAGES', 'UPDATE_PERSONNAGES', this.personnagesData);
            }
        }
    }

    // --- Commandes Documents ---
    toggleAcces(titre) {
        const index = this.documentsData.findIndex(d => d.titre === titre);
        if (index !== -1) {
            this.documentsData[index].accessible = !this.documentsData[index].accessible;
            console.log(`Statut d'accessibilité de ${titre} basculé: ${this.documentsData[index].accessible}.`);
            
            this.saveAndBroadcast('DOCUMENTS', 'UPDATE_DOCUMENTS', this.documentsData); 
        }
    }

    // --- Commandes Authentification ---
    /**
     * Vérifie un PIN et renvoie les infos de connexion associées, ou null si invalide.
     * @param {string} pin - Le code saisi par le joueur.
     * @returns {{role: string, nomPersonnage: string|null}|null} Infos de connexion, ou null.
     */
    verifierPin(pin) {
        const entry = this.joueursData.find(j => String(j.pin) === String(pin));
        if (!entry) return null;

        // Rétro-compatibilité : si "role" est absent, on déduit 'mj' ou 'joueur'
        const role = entry.role || (entry.nomPersonnage ? 'joueur' : 'mj');
        return {
            role,
            nomPersonnage: entry.nomPersonnage || null
        };
    }

    // --- Commandes CARTES (grille hexagonale) ---

    /**
     * Renvoie la carte actuellement active (visible des joueurs), ou null.
     */
    getCarteActive() {
        return this.cartesData.find(c => c.active) || null;
    }

    /**
     * Calcule les 6 voisins axiaux (q, r) d'une case hexagonale.
     */
    getVoisins(q, r) {
        return [
            { q: q + 1, r: r },
            { q: q - 1, r: r },
            { q: q, r: r + 1 },
            { q: q, r: r - 1 },
            { q: q + 1, r: r - 1 },
            { q: q - 1, r: r + 1 }
        ];
    }

    /**
     * Indice du côté opposé (le côté `i` d'une case correspond au côté
     * `OPPOSES[i]` de la case voisine adjacente dans cette direction).
     */
    static get OPPOSES() {
        return [1, 0, 3, 2, 5, 4];
    }

    /**
     * Renvoie l'indice de direction (0-5, dans le même ordre que getVoisins)
     * allant de (q1,r1) vers la case adjacente (q2,r2), ou -1 si non adjacentes.
     */
    getDirectionVers(q1, r1, q2, r2) {
        const voisins = this.getVoisins(q1, r1);
        return voisins.findIndex(v => v.q === q2 && v.r === r2);
    }

    /**
     * Vérifie si un mur bloque le passage entre deux cases adjacentes (q1,r1) et (q2,r2),
     * qu'il ait été posé du côté de l'une ou de l'autre case (mur "miroir").
     */
    existeMurEntre(carte, q1, r1, q2, r2) {
        const murs = carte.murs || [];
        const direction = this.getDirectionVers(q1, r1, q2, r2);
        if (direction === -1) return false; // pas adjacentes

        const directionOpposee = StateManager.OPPOSES[direction];

        const murCoteA = murs.some(m => m.q === q1 && m.r === r1 && m.cote === direction);
        const murCoteB = murs.some(m => m.q === q2 && m.r === r2 && m.cote === directionOpposee);

        return murCoteA || murCoteB;
    }

    /**
     * Vérifie que (q, r) est bien à l'intérieur d'une grille hexagonale de rayon donné.
     */
    estDansLaGrille(q, r, rayon) {
        const s = -q - r;
        return Math.abs(q) <= rayon && Math.abs(r) <= rayon && Math.abs(s) <= rayon;
    }

    /**
     * Déplacement d'un joueur : ne peut bouger que son propre pion, d'une case adjacente,
     * et seulement si la case cible est libre, dans la grille, et qu'aucun mur ne bloque le passage.
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

        // Vérifier que la case cible est dans la grille
        if (!this.estDansLaGrille(qCible, rCible, carte.rayon)) {
            console.warn('Case cible hors de la grille.');
            return;
        }

        // Vérifier l'adjacence (mouvement case par case uniquement)
        const voisins = this.getVoisins(pion.q, pion.r);
        const estAdjacente = voisins.some(v => v.q === qCible && v.r === rCible);
        if (!estAdjacente) {
            console.warn(`Déplacement refusé pour ${nomPersonnage} : case non adjacente.`);
            return;
        }

        // Vérifier qu'aucun mur ne bloque le passage entre les deux cases
        if (this.existeMurEntre(carte, pion.q, pion.r, qCible, rCible)) {
            console.warn(`Déplacement refusé pour ${nomPersonnage} : un mur bloque le passage.`);
            return;
        }

        // Vérifier qu'aucun autre pion n'occupe déjà la case cible
        const occupee = carte.pions.some(p => p.q === qCible && p.r === rCible);
        if (occupee) {
            console.warn('Case cible déjà occupée par un autre pion.');
            return;
        }

        pion.q = qCible;
        pion.r = rCible;
        this.saveAndBroadcast('CARTES', 'UPDATE_CARTES', this.cartesData);
    }

    /**
     * Déplacement libre par le MJ : aucune contrainte d'adjacence, mais la case
     * doit rester dans la grille et libre.
     */
    mjDeplacerPion(carteId, nomPersonnage, qCible, rCible) {
        const carte = this.cartesData.find(c => c.id === carteId);
        if (!carte) return;

        const pion = carte.pions.find(p => p.nomPersonnage === nomPersonnage);
        if (!pion) return;

        if (!this.estDansLaGrille(qCible, rCible, carte.rayon)) {
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
        this.saveAndBroadcast('CARTES', 'UPDATE_CARTES', this.cartesData);
    }

    /**
     * Ajoute un pion sur une carte donnée, à une position donnée (par défaut le centre).
     */
    mjAjouterPion(carteId, nomPersonnage, q = 0, r = 0) {
        const carte = this.cartesData.find(c => c.id === carteId);
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
        this.saveAndBroadcast('CARTES', 'UPDATE_CARTES', this.cartesData);
    }

    /**
     * Retire le pion d'un personnage sur une carte donnée.
     */
    mjRetirerPion(carteId, nomPersonnage) {
        const carte = this.cartesData.find(c => c.id === carteId);
        if (!carte) return;

        carte.pions = carte.pions.filter(p => p.nomPersonnage !== nomPersonnage);
        this.saveAndBroadcast('CARTES', 'UPDATE_CARTES', this.cartesData);
    }

    /**
     * Crée une nouvelle carte nommée avec un rayon donné.
     */
    mjCreerCarte(nom, rayon) {
        const nouvelId = this.cartesData.length > 0
            ? Math.max(...this.cartesData.map(c => c.id)) + 1
            : 1;

        this.cartesData.push({
            id: nouvelId,
            nom,
            rayon,
            active: false,
            pions: [],
            decors: [],
            murs: []
        });
        this.saveAndBroadcast('CARTES', 'UPDATE_CARTES', this.cartesData);
    }

    /**
     * Définit la carte active (visible des joueurs) ; désactive les autres.
     */
    mjActiverCarte(carteId) {
        this.cartesData.forEach(c => { c.active = (c.id === carteId); });
        this.saveAndBroadcast('CARTES', 'UPDATE_CARTES', this.cartesData);
    }

    /**
     * Supprime une carte.
     */
    mjSupprimerCarte(carteId) {
        this.cartesData = this.cartesData.filter(c => c.id !== carteId);
        this.saveAndBroadcast('CARTES', 'UPDATE_CARTES', this.cartesData);
    }

    /**
     * Pose ou retire un décor sur une case d'une carte donnée.
     * Si type est null/undefined, le décor de la case est supprimé.
     */
    mjPeindreDecor(carteId, q, r, type) {
        const carte = this.cartesData.find(c => c.id === carteId);
        if (!carte) return;

        if (!carte.decors) carte.decors = [];

        if (!this.estDansLaGrille(q, r, carte.rayon)) {
            console.warn('Case hors de la grille, décor non posé.');
            return;
        }

        const index = carte.decors.findIndex(d => d.q === q && d.r === r);

        if (!type) {
            // Effacer le décor de cette case
            if (index !== -1) carte.decors.splice(index, 1);
        } else if (index !== -1) {
            carte.decors[index].type = type;
        } else {
            carte.decors.push({ q, r, type });
        }

        this.saveAndBroadcast('CARTES', 'UPDATE_CARTES', this.cartesData);
    }

    /**
     * Bascule un mur sur le côté `cote` (0-5) de la case (q, r) :
     * l'ajoute s'il n'existe pas, le retire s'il existe déjà.
     */
    mjToggleMur(carteId, q, r, cote) {
        const carte = this.cartesData.find(c => c.id === carteId);
        if (!carte) return;

        if (!carte.murs) carte.murs = [];

        if (!this.estDansLaGrille(q, r, carte.rayon)) {
            console.warn('Case hors de la grille, mur non posé.');
            return;
        }

        const index = carte.murs.findIndex(m => m.q === q && m.r === r && m.cote === cote);
        if (index !== -1) {
            carte.murs.splice(index, 1);
        } else {
            carte.murs.push({ q, r, cote });
        }

        this.saveAndBroadcast('CARTES', 'UPDATE_CARTES', this.cartesData);
    }
    
    // --- État Initial pour un Nouveau Client ---
    getInitialState() {
        return {
            personnages: this.personnagesData,
            documents: this.documentsData,
            scenario: this.scenarioData,
            affiches: this.affichesData,
            cartes: this.cartesData,
            displayId: this.currentDisplayId,
        };
    }
}


// --- DÉMARRAGE DU SERVEUR ---

// Création du serveur WebSocket
const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`Serveur WebSocket démarré sur le port ${PORT}`);
    console.log(`Utilisez l'adresse : ws://localhost:${PORT}`);
});

// Création de l'unique instance du gestionnaire d'état
const stateManager = new StateManager(wss);


// --- Gestion des Connexions ---
wss.on('connection', (ws) => {
    console.log('Nouveau client connecté.');

    // 1. Envoyer l'état INITIAL des tableaux de données
    ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        payload: stateManager.getInitialState()
    }));  
  
    // 2. Écouter les messages du client (Commandes)
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            
            // Dispatch des commandes vers la classe StateManager
            switch (data.type) {
                case 'UPDATE_STATUS_COMMAND':
                    stateManager.updateScenarioStatus(data.stepId, data.newStatus);
                    break;

                case 'TOGGLE_RENCONTRE_COMMAND':
                    stateManager.toggleRencontre(data.personnageNom); 
                    break;
                    
                case 'TOGGLE_SECRET_COMMAND':
                    stateManager.toggleSecret(data.personnageNom, data.secretCle);
                    break;
                
                case 'TOGGLE_ACCES_COMMAND':
                    stateManager.toggleAcces(data.documentTitre); 
                    break;

                case 'UPDATE_DISPLAY_ID_COMMAND': 
                    stateManager.updateDisplayId(data.displayId);
                    break;

                case 'TOGGLE_MORT_COMMAND':
                    stateManager.toggleMort(data.personnageNom); 
                    break;

                case 'LOGIN_COMMAND': {
                    const infosConnexion = stateManager.verifierPin(data.pin);
                    if (infosConnexion) {
                        ws.send(JSON.stringify({
                            type: 'LOGIN_SUCCESS',
                            payload: {
                                nomPersonnage: infosConnexion.nomPersonnage,
                                role: infosConnexion.role,
                                pin: data.pin
                            }
                        }));
                        console.log(`Connexion réussie : rôle=${infosConnexion.role}, personnage=${infosConnexion.nomPersonnage ?? '(aucun)'}`);
                    } else {
                        ws.send(JSON.stringify({
                            type: 'LOGIN_FAILED',
                            payload: { message: 'PIN invalide' }
                        }));
                        console.log(`Tentative de connexion échouée avec le PIN : ${data.pin}`);
                    }
                    break;
                }

                // --- Commandes Carte (joueur) ---
                case 'DEPLACER_PION_COMMAND':
                    stateManager.deplacerPionJoueur(data.nomPersonnage, data.q, data.r);
                    break;

                // --- Commandes Carte (MJ) ---
                case 'MJ_DEPLACER_PION_COMMAND':
                    stateManager.mjDeplacerPion(data.carteId, data.nomPersonnage, data.q, data.r);
                    break;

                case 'MJ_AJOUTER_PION_COMMAND':
                    stateManager.mjAjouterPion(data.carteId, data.nomPersonnage, data.q ?? 0, data.r ?? 0);
                    break;

                case 'MJ_RETIRER_PION_COMMAND':
                    stateManager.mjRetirerPion(data.carteId, data.nomPersonnage);
                    break;

                case 'MJ_CREER_CARTE_COMMAND':
                    stateManager.mjCreerCarte(data.nom, data.rayon);
                    break;

                case 'MJ_ACTIVER_CARTE_COMMAND':
                    stateManager.mjActiverCarte(data.carteId);
                    break;

                case 'MJ_SUPPRIMER_CARTE_COMMAND':
                    stateManager.mjSupprimerCarte(data.carteId);
                    break;

                case 'MJ_PEINDRE_DECOR_COMMAND':
                    stateManager.mjPeindreDecor(data.carteId, data.q, data.r, data.decorType);
                    break;

                case 'MJ_TOGGLE_MUR_COMMAND':
                    stateManager.mjToggleMur(data.carteId, data.q, data.r, data.cote);
                    break;
                    
                default:
                    console.warn(`Type de commande inconnu: ${data.type}`);
            }
        } catch (error) {
            console.error('Erreur lors du traitement du message client:', error);
        }
    });

    // 3. Gérer la déconnexion
    ws.on('close', () => {
        console.log('Un client est déconnecté.');
    });
});