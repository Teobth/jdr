const path = require('path');

// --- CHOIX DE L'HISTOIRE EN COURS ---
// Changez cette valeur pour basculer entre les scénarios.
const HISTOIRE = 3;

const DOSSIERS_HISTOIRE = {
    1: 'Par cinq mètres de fond',
    2: 'Les maudits',
    3: "Le rejeton d'Azathoth"
};

const dossier = DOSSIERS_HISTOIRE[HISTOIRE] || 'Les maudits';

const RACINE_DONNEES = '/home/teo/Documents/JDR/Scénar.json/' + dossier;

const WS_PORT = 3000;
const IMAGES_PORT = 3000 + HISTOIRE;

// --- CHEMINS DES FICHIERS DE DONNÉES ---
const FILES = {
    PERSONNAGES: path.join(RACINE_DONNEES, 'personnages.json'),
    DOCUMENTS: path.join(RACINE_DONNEES, 'documents.json'),
    SCENARIO: path.join(RACINE_DONNEES, 'scenario.json'),
    AFFICHE: path.join(RACINE_DONNEES, 'affiche.json'),
    JOUEURS: path.join(RACINE_DONNEES, 'joueurs.json'),
    CARTES: path.join(RACINE_DONNEES, 'cartes.json'),
    ACTES: path.join(RACINE_DONNEES, 'actes.json'),
    LIENS: path.join(RACINE_DONNEES, 'liens.json'),
    POSITIONS: path.join(RACINE_DONNEES, 'positions.json'),
    LIENS_JOUEURS: path.join(RACINE_DONNEES, 'liensJoueurs.json'),
    POSITIONS_JOUEURS: path.join(RACINE_DONNEES, 'positionsJoueurs.json')
};

module.exports = {
    dossier,
    RACINE_DONNEES,
    WS_PORT,
    IMAGES_PORT,
    FILES
};