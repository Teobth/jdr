export type CategorieDecor = 'nature' | 'structure' | 'special';

export interface TypeDecor {
  id: string;
  label: string;
  categorie: CategorieDecor;
  /** Couleur dominante utilisée pour l'aperçu dans la palette. */
  couleur: string;
  /**
   * Génère le markup SVG interne (sans balise <svg> englobante) de l'icône,
   * centré sur (cx, cy) avec une échelle donnée (rayon approximatif en px).
   */
  rendu: (cx: number, cy: number, echelle: number) => string;
}

export const LABELS_CATEGORIES: Record<CategorieDecor, string> = {
  nature: 'Nature',
  structure: 'Structures',
  special: 'Spécial'
};

export const TYPES_DECOR: TypeDecor[] = [
  {
    id: 'arbre',
    label: 'Arbre',
    categorie: 'nature',
    couleur: '#3d7a3d',
    rendu: (cx, cy, e) => `
      <rect x="${cx - e * 0.08}" y="${cy}" width="${e * 0.16}" height="${e * 0.5}" fill="#5a3a22" />
      <circle cx="${cx}" cy="${cy - e * 0.15}" r="${e * 0.55}" fill="#3d7a3d" stroke="#274d27" stroke-width="1.5" />
      <circle cx="${cx - e * 0.3}" cy="${cy + e * 0.05}" r="${e * 0.35}" fill="#4a8f4a" stroke="#274d27" stroke-width="1.5" />
      <circle cx="${cx + e * 0.3}" cy="${cy + e * 0.05}" r="${e * 0.35}" fill="#4a8f4a" stroke="#274d27" stroke-width="1.5" />
    `
  },
  {
    id: 'rocher',
    label: 'Rocher',
    categorie: 'nature',
    couleur: '#7a7a78',
    rendu: (cx, cy, e) => `
      <polygon points="
        ${cx - e * 0.6},${cy + e * 0.35}
        ${cx - e * 0.35},${cy - e * 0.25}
        ${cx},${cy - e * 0.5}
        ${cx + e * 0.4},${cy - e * 0.2}
        ${cx + e * 0.55},${cy + e * 0.35}
        ${cx + e * 0.1},${cy + e * 0.5}
        ${cx - e * 0.3},${cy + e * 0.5}
      " fill="#7a7a78" stroke="#4a4a48" stroke-width="1.5" />
      <line x1="${cx - e * 0.2}" y1="${cy - e * 0.1}" x2="${cx + e * 0.15}" y2="${cy + e * 0.2}" stroke="#5a5a58" stroke-width="1.2" />
    `
  },
  {
    id: 'mur',
    label: 'Mur',
    categorie: 'structure',
    couleur: '#8a8a8a',
    rendu: (cx, cy, e) => `
      <rect x="${cx - e * 0.55}" y="${cy - e * 0.4}" width="${e * 1.1}" height="${e * 0.8}" fill="#8a8a8a" stroke="#4a4a4a" stroke-width="1.5" rx="${e * 0.05}" />
      <line x1="${cx - e * 0.55}" y1="${cy - e * 0.13}" x2="${cx + e * 0.55}" y2="${cy - e * 0.13}" stroke="#4a4a4a" stroke-width="1" />
      <line x1="${cx - e * 0.55}" y1="${cy + e * 0.14}" x2="${cx + e * 0.55}" y2="${cy + e * 0.14}" stroke="#4a4a4a" stroke-width="1" />
      <line x1="${cx - e * 0.18}" y1="${cy - e * 0.4}" x2="${cx - e * 0.18}" y2="${cy - e * 0.13}" stroke="#4a4a4a" stroke-width="1" />
      <line x1="${cx + e * 0.18}" y1="${cy - e * 0.4}" x2="${cx + e * 0.18}" y2="${cy - e * 0.13}" stroke="#4a4a4a" stroke-width="1" />
      <line x1="${cx}" y1="${cy - e * 0.13}" x2="${cx}" y2="${cy + e * 0.14}" stroke="#4a4a4a" stroke-width="1" />
      <line x1="${cx - e * 0.36}" y1="${cy - e * 0.13}" x2="${cx - e * 0.36}" y2="${cy + e * 0.14}" stroke="#4a4a4a" stroke-width="1" />
      <line x1="${cx + e * 0.36}" y1="${cy - e * 0.13}" x2="${cx + e * 0.36}" y2="${cy + e * 0.14}" stroke="#4a4a4a" stroke-width="1" />
      <line x1="${cx - e * 0.18}" y1="${cy + e * 0.14}" x2="${cx - e * 0.18}" y2="${cy + e * 0.4}" stroke="#4a4a4a" stroke-width="1" />
      <line x1="${cx + e * 0.18}" y1="${cy + e * 0.14}" x2="${cx + e * 0.18}" y2="${cy + e * 0.4}" stroke="#4a4a4a" stroke-width="1" />
    `
  },
  {
    id: 'echelle',
    label: 'Échelle',
    categorie: 'structure',
    couleur: '#b08050',
    rendu: (cx, cy, e) => `
      <line x1="${cx - e * 0.22}" y1="${cy - e * 0.55}" x2="${cx - e * 0.22}" y2="${cy + e * 0.55}" stroke="#8a5a32" stroke-width="${e * 0.08}" stroke-linecap="round" />
      <line x1="${cx + e * 0.22}" y1="${cy - e * 0.55}" x2="${cx + e * 0.22}" y2="${cy + e * 0.55}" stroke="#8a5a32" stroke-width="${e * 0.08}" stroke-linecap="round" />
      <line x1="${cx - e * 0.22}" y1="${cy - e * 0.35}" x2="${cx + e * 0.22}" y2="${cy - e * 0.35}" stroke="#b08050" stroke-width="${e * 0.06}" />
      <line x1="${cx - e * 0.22}" y1="${cy - e * 0.12}" x2="${cx + e * 0.22}" y2="${cy - e * 0.12}" stroke="#b08050" stroke-width="${e * 0.06}" />
      <line x1="${cx - e * 0.22}" y1="${cy + e * 0.11}" x2="${cx + e * 0.22}" y2="${cy + e * 0.11}" stroke="#b08050" stroke-width="${e * 0.06}" />
      <line x1="${cx - e * 0.22}" y1="${cy + e * 0.34}" x2="${cx + e * 0.22}" y2="${cy + e * 0.34}" stroke="#b08050" stroke-width="${e * 0.06}" />
    `
  },
  {
    id: 'porte',
    label: 'Porte',
    categorie: 'structure',
    couleur: '#8a6238',
    rendu: (cx, cy, e) => `
      <rect x="${cx - e * 0.32}" y="${cy - e * 0.5}" width="${e * 0.64}" height="${e * 1.0}" rx="${e * 0.3}" fill="#5a3a22" stroke="#2e1f12" stroke-width="1.5" />
      <rect x="${cx - e * 0.22}" y="${cy - e * 0.38}" width="${e * 0.44}" height="${e * 0.82}" rx="${e * 0.2}" fill="#8a6238" />
      <circle cx="${cx + e * 0.1}" cy="${cy + e * 0.05}" r="${e * 0.06}" fill="#2e1f12" />
    `
  },
  {
    id: 'eau',
    label: 'Eau',
    categorie: 'nature',
    couleur: '#2f6f8f',
    rendu: (cx, cy, e) => `
      <path d="M ${cx - e * 0.55} ${cy - e * 0.1}
               Q ${cx - e * 0.3} ${cy - e * 0.35}, ${cx} ${cy - e * 0.1}
               Q ${cx + e * 0.3} ${cy + e * 0.15}, ${cx + e * 0.55} ${cy - e * 0.1}
               L ${cx + e * 0.55} ${cy + e * 0.4}
               Q ${cx + 0.3 * e} ${cy + e * 0.6}, ${cx} ${cy + e * 0.4}
               Q ${cx - e * 0.3} ${cy + e * 0.2}, ${cx - e * 0.55} ${cy + e * 0.4} Z"
            fill="#2f6f8f" stroke="#1c4a60" stroke-width="1.2" />
    `
  },
  {
    id: 'herbe',
    label: 'Herbe haute',
    categorie: 'nature',
    couleur: '#6a9b3f',
    rendu: (cx, cy, e) => `
      <line x1="${cx - e * 0.3}" y1="${cy + e * 0.4}" x2="${cx - e * 0.4}" y2="${cy - e * 0.3}" stroke="#6a9b3f" stroke-width="${e * 0.1}" stroke-linecap="round" />
      <line x1="${cx}" y1="${cy + e * 0.4}" x2="${cx - e * 0.05}" y2="${cy - e * 0.45}" stroke="#79ad4c" stroke-width="${e * 0.1}" stroke-linecap="round" />
      <line x1="${cx + e * 0.3}" y1="${cy + e * 0.4}" x2="${cx + e * 0.4}" y2="${cy - e * 0.3}" stroke="#6a9b3f" stroke-width="${e * 0.1}" stroke-linecap="round" />
    `
  },
  {
    id: 'feu',
    label: 'Feu',
    categorie: 'nature',
    couleur: '#c4561f',
    rendu: (cx, cy, e) => `
      <path d="M ${cx} ${cy + e * 0.55} 
               C ${cx - e * 0.55} ${cy + e * 0.55}, ${cx - e * 0.65} ${cy + e * 0.05}, ${cx - e * 0.4} ${cy - e * 0.15}
               Q ${cx - e * 0.3} ${cy - e * 0.25}, ${cx - e * 0.35} ${cy - e * 0.1}
               C ${cx - e * 0.4} ${cy - e * 0.45}, ${cx - e * 0.2} ${cy - e * 0.35}, ${cx - e * 0.25} ${cy - e * 0.2}
               C ${cx - e * 0.3} ${cy - e * 0.65}, ${cx - e * 0.05} ${cy - e * 0.6}, ${cx - e * 0.05} ${cy - e * 0.8}
               C ${cx + e * 0.15} ${cy - e * 0.6}, ${cx + e * 0.15} ${cy - e * 0.4}, ${cx + e * 0.35} ${cy - e * 0.35}
               Q ${cx + e * 0.45} ${cy - e * 0.3}, ${cx + e * 0.35} ${cy - e * 0.15}
               C ${cx + e * 0.55} ${cy - e * 0.2}, ${cx + e * 0.65} ${cy + e * 0.1}, ${cx + e * 0.55} ${cy + e * 0.35}
               C ${cx + e * 0.45} ${cy + e * 0.55}, ${cx} ${cy + e * 0.55}, ${cx} ${cy + e * 0.55} Z" 
            fill="#c4561f" stroke="#8a3010" stroke-width="1.5" stroke-linejoin="round" />

      <path d="M ${cx} ${cy + e * 0.5}
               C ${cx - e * 0.3} ${cy + e * 0.5}, ${cx - e * 0.35} ${cy + e * 0.2}, ${cx - e * 0.2} ${cy + e * 0.1}
               Q ${cx - e * 0.1} ${cy + e * 0.05}, ${cx} ${cy - e * 0.15}
               Q ${cx + e * 0.1} ${cy + e * 0.05}, ${cx + e * 0.2} ${cy + e * 0.1}
               C ${cx + e * 0.35} ${cy + e * 0.2}, ${cx + e * 0.3} ${cy + e * 0.5}, ${cx} ${cy + e * 0.5} Z" 
            fill="#f0a030" />


    `
  },
  {
    id: 'loupe',
    label: 'Loupe / Recherche',
    categorie: 'special',
    couleur: '#2f6f8f',
    rendu: (cx, cy, e) => `
      <line x1="${cx + e * 0.15}" y1="${cy + e * 0.15}" x2="${cx + e * 0.5}" y2="${cy + e * 0.5}" 
            stroke="#1c4a60" stroke-width="${e * 0.15}" stroke-linecap="round" />
            
      <circle cx="${cx - e * 0.1}" cy="${cy - e * 0.1}" r="${e * 0.3}" 
              fill="#ffffff" fill-opacity="0.2" stroke="#1c4a60" stroke-width="${e * 0.12}" />
    `
  },
  {
    id: 'ossements',
    label: 'Ossements',
    categorie: 'special',
    couleur: '#d8d2c0',
    rendu: (cx, cy, e) => `
      <ellipse cx="${cx}" cy="${cy - e * 0.15}" rx="${e * 0.28}" ry="${e * 0.32}" fill="#e8e2d0" stroke="#a8a290" stroke-width="1.2" />
      <circle cx="${cx - e * 0.1}" cy="${cy - e * 0.2}" r="${e * 0.06}" fill="#3a352a" />
      <circle cx="${cx + e * 0.1}" cy="${cy - e * 0.2}" r="${e * 0.06}" fill="#3a352a" />
      <line x1="${cx - e * 0.4}" y1="${cy + e * 0.35}" x2="${cx + e * 0.4}" y2="${cy + e * 0.35}" stroke="#e8e2d0" stroke-width="${e * 0.14}" stroke-linecap="round" />
      <circle cx="${cx - e * 0.4}" cy="${cy + e * 0.35}" r="${e * 0.1}" fill="#e8e2d0" stroke="#a8a290" stroke-width="1" />
      <circle cx="${cx + e * 0.4}" cy="${cy + e * 0.35}" r="${e * 0.1}" fill="#e8e2d0" stroke="#a8a290" stroke-width="1" />
    `
  },
  {
    id: 'pont',
    label: 'Pont',
    categorie: 'structure',
    couleur: '#9a7a4a',
    rendu: (cx, cy, e) => `
      <rect x="${cx - e * 0.6}" y="${cy - e * 0.15}" width="${e * 1.2}" height="${e * 0.3}" fill="#9a7a4a" stroke="#5a3a22" stroke-width="1.2" />
      <line x1="${cx - e * 0.45}" y1="${cy - e * 0.15}" x2="${cx - e * 0.45}" y2="${cy + e * 0.15}" stroke="#5a3a22" stroke-width="1" />
      <line x1="${cx - e * 0.15}" y1="${cy - e * 0.15}" x2="${cx - e * 0.15}" y2="${cy + e * 0.15}" stroke="#5a3a22" stroke-width="1" />
      <line x1="${cx + e * 0.15}" y1="${cy - e * 0.15}" x2="${cx + e * 0.15}" y2="${cy + e * 0.15}" stroke="#5a3a22" stroke-width="1" />
      <line x1="${cx + e * 0.45}" y1="${cy - e * 0.15}" x2="${cx + e * 0.45}" y2="${cy + e * 0.15}" stroke="#5a3a22" stroke-width="1" />
      <line x1="${cx - e * 0.6}" y1="${cy - e * 0.25}" x2="${cx + e * 0.6}" y2="${cy - e * 0.25}" stroke="#6a4a2a" stroke-width="${e * 0.08}" />
      <line x1="${cx - e * 0.6}" y1="${cy + e * 0.25}" x2="${cx + e * 0.6}" y2="${cy + e * 0.25}" stroke="#6a4a2a" stroke-width="${e * 0.08}" />
    `
  },
  {
    id: 'glace',
    label: 'Glace',
    categorie: 'nature',
    couleur: '#aee0ee',
    rendu: (cx, cy, e) => `
      <polygon points="
        ${cx - e * 0.55},${cy + e * 0.4}
        ${cx - e * 0.3},${cy - e * 0.3}
        ${cx + e * 0.1},${cy - e * 0.5}
        ${cx + e * 0.5},${cy - e * 0.1}
        ${cx + e * 0.5},${cy + e * 0.4}
      " fill="#aee0ee" fill-opacity="0.7" stroke="#dff5fb" stroke-width="1.5" />
      <line x1="${cx - e * 0.2}" y1="${cy + e * 0.1}" x2="${cx + e * 0.1}" y2="${cy - e * 0.25}" stroke="#fff" stroke-width="1" />
      <line x1="${cx}" y1="${cy + e * 0.3}" x2="${cx + e * 0.3}" y2="${cy - e * 0.05}" stroke="#fff" stroke-width="1" />
    `
  },
  {
    id: 'tresor',
    label: 'Trésor',
    categorie: 'special',
    couleur: '#d4af37',
    rendu: (cx, cy, e) => `
      <rect x="${cx - e * 0.42}" y="${cy - e * 0.05}" width="${e * 0.84}" height="${e * 0.45}" fill="#6b4a22" stroke="#3a2812" stroke-width="1.5" />
      <path d="M ${cx - e * 0.42} ${cy - e * 0.05}
               Q ${cx} ${cy - e * 0.45}, ${cx + e * 0.42} ${cy - e * 0.05} Z"
            fill="#8a6238" stroke="#3a2812" stroke-width="1.5" />
      <circle cx="${cx}" cy="${cy + e * 0.05}" r="${e * 0.08}" fill="#d4af37" />
      <circle cx="${cx - e * 0.2}" cy="${cy + e * 0.25}" r="${e * 0.07}" fill="#f0cf50" />
      <circle cx="${cx + e * 0.15}" cy="${cy + e * 0.28}" r="${e * 0.06}" fill="#d4af37" />
    `
  },
  {
    id: 'coffre',
    label: 'Coffre',
    categorie: 'structure',
    couleur: '#7a5a32',
    rendu: (cx, cy, e) => `
      <rect x="${cx - e * 0.4}" y="${cy - e * 0.05}" width="${e * 0.8}" height="${e * 0.4}" fill="#7a5a32" stroke="#3a2812" stroke-width="1.5" />
      <rect x="${cx - e * 0.4}" y="${cy - e * 0.3}" width="${e * 0.8}" height="${e * 0.28}" rx="${e * 0.04}" fill="#8f6a3c" stroke="#3a2812" stroke-width="1.5" />
      <rect x="${cx - e * 0.06}" y="${cy - e * 0.12}" width="${e * 0.12}" height="${e * 0.16}" fill="#d4af37" />
    `
  },
  {
    id: 'table',
    label: 'Table',
    categorie: 'structure',
    couleur: '#8a6238',
    rendu: (cx, cy, e) => `
      <ellipse cx="${cx}" cy="${cy - e * 0.1}" rx="${e * 0.5}" ry="${e * 0.2}" fill="#8a6238" stroke="#4a2f18" stroke-width="1.5" />
      <line x1="${cx - e * 0.35}" y1="${cy}" x2="${cx - e * 0.3}" y2="${cy + e * 0.4}" stroke="#5a3a22" stroke-width="${e * 0.08}" />
      <line x1="${cx + e * 0.35}" y1="${cy}" x2="${cx + e * 0.3}" y2="${cy + e * 0.4}" stroke="#5a3a22" stroke-width="${e * 0.08}" />
    `
  },
  {
    id: 'lit',
    label: 'Lit',
    categorie: 'structure',
    couleur: '#6a4a8a',
    rendu: (cx, cy, e) => `
      <rect x="${cx - e * 0.5}" y="${cy - e * 0.1}" width="${e * 1.0}" height="${e * 0.45}" rx="${e * 0.05}" fill="#5a3a22" stroke="#3a2412" stroke-width="1.5" />
      <rect x="${cx - e * 0.42}" y="${cy - e * 0.02}" width="${e * 0.84}" height="${e * 0.28}" fill="#6a4a8a" />
      <rect x="${cx - e * 0.42}" y="${cy - e * 0.3}" width="${e * 0.22}" height="${e * 0.3}" rx="${e * 0.04}" fill="#f0ece0" stroke="#3a2412" stroke-width="1" />
    `
  },
  {
    id: 'tonneau',
    label: 'Tonneau',
    categorie: 'structure',
    couleur: '#9a6a32',
    rendu: (cx, cy, e) => `
      <rect x="${cx - e * 0.32}" y="${cy - e * 0.45}" width="${e * 0.64}" height="${e * 0.9}" rx="${e * 0.18}" fill="#9a6a32" stroke="#5a3a18" stroke-width="1.5" />
      <line x1="${cx - e * 0.32}" y1="${cy - e * 0.2}" x2="${cx + e * 0.32}" y2="${cy - e * 0.2}" stroke="#5a3a18" stroke-width="1.2" />
      <line x1="${cx - e * 0.32}" y1="${cy + e * 0.2}" x2="${cx + e * 0.32}" y2="${cy + e * 0.2}" stroke="#5a3a18" stroke-width="1.2" />
    `
  }
];

export function getTypeDecor(id: string | null | undefined): TypeDecor | undefined {
  if (!id) return undefined;
  return TYPES_DECOR.find(t => t.id === id);
}