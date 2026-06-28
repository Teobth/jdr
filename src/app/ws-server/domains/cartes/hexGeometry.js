/**
 * Géométrie d'une grille hexagonale en coordonnées axiales (q, r).
 *
 * Ce fichier ne contient AUCUN état : uniquement des fonctions pures de
 * calcul, dans le même ordre/convention que `src/app/service/carteService.ts`
 * côté client (DIRECTIONS, OPPOSES). Si vous changez une formule ici,
 * vérifiez si l'équivalent côté client doit changer aussi.
 */

/** Les 6 directions axiales d'une grille hexagonale (flat-top). */
const DIRECTIONS = [
    { q: 1, r: 0 },
    { q: -1, r: 0 },
    { q: 0, r: 1 },
    { q: 0, r: -1 },
    { q: 1, r: -1 },
    { q: -1, r: 1 }
];

/**
 * Indice du côté opposé (le côté `i` d'une case correspond au côté
 * `OPPOSES[i]` de la case voisine adjacente dans cette direction).
 */
const OPPOSES = [1, 0, 3, 2, 5, 4];

/** Renvoie les 6 voisins axiaux (q, r) d'une case donnée. */
function getVoisins(q, r) {
    return DIRECTIONS.map(d => ({ q: q + d.q, r: r + d.r }));
}

/**
 * Renvoie l'indice de direction (0-5, dans l'ordre de DIRECTIONS) allant de
 * (q1,r1) vers la case adjacente (q2,r2), ou -1 si elles ne sont pas adjacentes.
 */
function getDirectionVers(q1, r1, q2, r2) {
    return getVoisins(q1, r1).findIndex(v => v.q === q2 && v.r === r2);
}

/**
 * Vérifie si un mur bloque le passage entre deux cases adjacentes,
 * qu'il ait été posé du côté de l'une ou de l'autre case (mur "miroir").
 */
function existeMurEntre(carte, q1, r1, q2, r2) {
    const murs = carte.murs || [];
    const direction = getDirectionVers(q1, r1, q2, r2);
    if (direction === -1) return false; // pas adjacentes

    const directionOpposee = OPPOSES[direction];
    const murCoteA = murs.some(m => m.q === q1 && m.r === r1 && m.cote === direction);
    const murCoteB = murs.some(m => m.q === q2 && m.r === r2 && m.cote === directionOpposee);

    return murCoteA || murCoteB;
}

/** Vérifie que (q, r) est bien à l'intérieur d'une grille hexagonale de rayon donné. */
function estDansLaGrille(q, r, rayon) {
    const s = -q - r;
    return Math.abs(q) <= rayon && Math.abs(r) <= rayon && Math.abs(s) <= rayon;
}

module.exports = {
    DIRECTIONS,
    OPPOSES,
    getVoisins,
    getDirectionVers,
    existeMurEntre,
    estDansLaGrille
};