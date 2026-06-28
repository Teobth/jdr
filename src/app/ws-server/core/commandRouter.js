/**
 * Construit la table de routage { type de commande -> fonction de traitement }.
 *
 * Pour ajouter une nouvelle commande : ajoutez une entrée dans l'objet
 * retourné, qui appelle la méthode du store concerné. Ce fichier ne doit
 * contenir aucune logique métier, seulement du câblage.
 *
 * @param {object} stores - Toutes les stores du domaine, déjà instanciées.
 * @param {import('ws').WebSocket} ws - La connexion du client à l'origine du message (utile pour répondre directement, ex: login).
 */
function buildCommandHandlers(stores, ws) {
    const { scenario, personnages, documents, actes, auth, lieu, cartes, liens } = stores;

    return {
        // --- Scénario ---
        UPDATE_STATUS_COMMAND: (data) => scenario.updateStatus(data.stepId, data.newStatus),
        MJ_CREER_ETAPE_COMMAND: (data) => scenario.creerEtape(data),
        MJ_MODIFIER_ETAPE_COMMAND: (data) => scenario.modifierEtape(data.stepId, data),
        MJ_SUPPRIMER_ETAPE_COMMAND: (data) => scenario.supprimerEtape(data.stepId),

        // --- Personnages ---
        TOGGLE_RENCONTRE_COMMAND: (data) => personnages.toggleRencontre(data.personnageNom),
        TOGGLE_MORT_COMMAND: (data) => personnages.toggleMort(data.personnageNom),
        TOGGLE_SECRET_COMMAND: (data) => personnages.toggleSecret(data.personnageNom, data.secretCle),

        // --- Documents ---
        TOGGLE_ACCES_COMMAND: (data) => documents.toggleAcces(data.documentTitre),

        // --- Liens (murder board) ---
        MJ_CREER_LIEN_COMMAND: (data) => liens.creerLien(data),
        MJ_MODIFIER_NOTE_LIEN_COMMAND: (data) => liens.modifierNote(data.lienId, data.note),
        MJ_SUPPRIMER_LIEN_COMMAND: (data) => liens.supprimerLien(data.lienId),

        // --- Actes ---
        TOGGLE_ACTE_ACTIF_COMMAND: (data) => actes.toggleActif(data.acte),

        // --- Lieu / Affiche ---
        UPDATE_DISPLAY_ID_COMMAND: (data) => lieu.updateDisplayId(data.displayId),

        // --- Authentification ---
        LOGIN_COMMAND: (data) => {
            const infosConnexion = auth.verifierPin(data.pin);
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
        },

        // --- Cartes (joueur) ---
        DEPLACER_PION_COMMAND: (data) => cartes.deplacerPionJoueur(data.nomPersonnage, data.q, data.r),

        // --- Cartes (MJ) ---
        MJ_DEPLACER_PION_COMMAND: (data) => cartes.mjDeplacerPion(data.carteId, data.nomPersonnage, data.q, data.r),
        MJ_AJOUTER_PION_COMMAND: (data) => cartes.mjAjouterPion(data.carteId, data.nomPersonnage, data.q ?? 0, data.r ?? 0),
        MJ_RETIRER_PION_COMMAND: (data) => cartes.mjRetirerPion(data.carteId, data.nomPersonnage),
        MJ_CREER_CARTE_COMMAND: (data) => cartes.mjCreerCarte(data.nom, data.rayon),
        MJ_ACTIVER_CARTE_COMMAND: (data) => cartes.mjActiverCarte(data.carteId),
        MJ_SUPPRIMER_CARTE_COMMAND: (data) => cartes.mjSupprimerCarte(data.carteId),
        MJ_PEINDRE_DECOR_COMMAND: (data) => cartes.mjPeindreDecor(data.carteId, data.q, data.r, data.decorType),
        MJ_TOGGLE_MUR_COMMAND: (data) => cartes.mjToggleMur(data.carteId, data.q, data.r, data.cote)
    };
}

/**
 * Traite un message brut reçu d'un client : parse le JSON, trouve le
 * handler correspondant au type, et l'exécute.
 */
function handleMessage(rawMessage, stores, ws) {
    let data;
    try {
        data = JSON.parse(rawMessage.toString());
    } catch (error) {
        console.error('Message reçu invalide (JSON illisible):', error);
        return;
    }

    const handlers = buildCommandHandlers(stores, ws);
    const handler = handlers[data.type];

    if (!handler) {
        console.warn(`Type de commande inconnu: ${data.type}`);
        return;
    }

    try {
        handler(data);
    } catch (error) {
        console.error(`Erreur lors du traitement de la commande ${data.type}:`, error);
    }
}

module.exports = { handleMessage };