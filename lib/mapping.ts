// Tables de mapping Phenix Store → Akanea
// Ces tables peuvent être migrées vers Supabase plus tard

export const PRODUITS: Record<string, { code: string; libelle: string }> = {
  "JH001": { code: "YP001", libelle: "SWEAT A CAPUCHE PETIT CORDON" },
  "JH101": { code: "YP002", libelle: "SWEAT A CAPUCHE GROS CORDON" },
  "JH120": { code: "YP003", libelle: "SWEAT A CAPUCHE SANS CORDON" },
  "BF385": { code: "YP004", libelle: "BONNET EPAIS" },
};

export const COULEURS: Record<string, { code: string; libelle: string }> = {
  "DEEP BLACK": { code: "0001", libelle: "NOIR" },
  "ARCTIC WHITE": { code: "0002", libelle: "BLANC" },
  "NEW FRENCH": { code: "0003", libelle: "BLEU MARINE" },
  "DUSTY BLUE": { code: "0004", libelle: "BLEU FONCE" },
  "DUSTY GREEN": { code: "0005", libelle: "VERT FONCE" },
  "MARINE GREE": { code: "0006", libelle: "GRIS CLAIR" },
  "NATURAL STO": { code: "0007", libelle: "GRIS CLAIR" },
  "VANILLA": { code: "0008", libelle: "BEIGE" },
};

export const TAILLES: Record<string, { code: string; libelle: string }> = {
  "0": { code: "0000", libelle: "TU" },
  "XS": { code: "0001", libelle: "XS" },
  "S": { code: "0002", libelle: "S" },
  "M": { code: "0003", libelle: "M" },
  "L": { code: "0004", libelle: "L" },
  "XL": { code: "0005", libelle: "XL" },
  "XXL": { code: "0006", libelle: "XXL" },
  "3XL": { code: "0007", libelle: "3XL" },
  "4XL": { code: "0008", libelle: "4XL" },
};

export const FOURNISSEURS: Record<string, { code: string }> = {
  "IMBRETEX": { code: "01" },
  "RALAWISE": { code: "02" },
};

export const VALEURS_FIXES = {
  type_operation: "C",
  stockeur: 94,
  depot: "Z0",
  zone: "PS1",
  famille: "HSS",
  article_nouveau: "O",
  type_mouvement: "ENT",
  gencod: "XXX",
  agence: "01",
};

// Fonction pour extraire la référence de base d'une référence fournisseur
export function extraireRefBase(refFournisseur: string): string | null {
  for (const prefix of Object.keys(PRODUITS)) {
    if (refFournisseur.startsWith(prefix)) {
      return prefix;
    }
  }
  return null;
}

// Fonction pour générer le code article interne
export function genererCodeArticle(
  refBase: string,
  couleur: string,
  taille: string,
  fournisseur: string = "IMBRETEX"
): string {
  const produit = PRODUITS[refBase] || { code: "XXXX" };
  const couleurData = COULEURS[couleur] || { code: "XXXX" };
  const tailleData = TAILLES[taille] || { code: "XXXX" };
  const fournisseurData = FOURNISSEURS[fournisseur] || { code: "XX" };

  return `${produit.code}-${couleurData.code}-${tailleData.code}-${fournisseurData.code}`;
}

// Type pour une ligne de BL
export interface LigneBL {
  ref: string;
  designation: string;
  couleur: string;
  taille: string;
  qte: number;
}

// Type pour les infos du BL
export interface InfoBL {
  refCommande: string;
  dateLivraison: Date;
  fournisseur: string;
  transporteur: string;
  nbColis: number;
  poidsTotal: number;
}

// Type pour une ligne transformée
export interface LigneTransformee {
  codeArticle: string;
  libelle: string;
  refExterne: string;
  couleur: string;
  couleurFournisseur: string;
  taille: string;
  qte: number;
  status: "ok" | "error";
  errorMessage?: string;
}

// Fonction pour transformer une ligne de BL
export function transformerLigne(
  ligne: LigneBL,
  fournisseur: string = "IMBRETEX"
): LigneTransformee {
  const refBase = extraireRefBase(ligne.ref);

  if (!refBase) {
    return {
      codeArticle: "ERREUR",
      libelle: "Référence inconnue",
      refExterne: ligne.ref,
      couleur: "",
      couleurFournisseur: ligne.couleur,
      taille: ligne.taille,
      qte: ligne.qte,
      status: "error",
      errorMessage: `Référence fournisseur inconnue: ${ligne.ref}`,
    };
  }

  const produit = PRODUITS[refBase];
  const couleurData = COULEURS[ligne.couleur];
  const tailleData = TAILLES[ligne.taille];

  const errors: string[] = [];
  if (!couleurData) errors.push(`Couleur inconnue: ${ligne.couleur}`);
  if (!tailleData) errors.push(`Taille inconnue: ${ligne.taille}`);

  if (errors.length > 0) {
    return {
      codeArticle: genererCodeArticle(refBase, ligne.couleur, ligne.taille, fournisseur),
      libelle: produit?.libelle || "Inconnu",
      refExterne: ligne.ref,
      couleur: couleurData?.libelle || ligne.couleur,
      couleurFournisseur: ligne.couleur,
      taille: tailleData?.libelle || ligne.taille,
      qte: ligne.qte,
      status: "error",
      errorMessage: errors.join(", "),
    };
  }

  return {
    codeArticle: genererCodeArticle(refBase, ligne.couleur, ligne.taille, fournisseur),
    libelle: produit.libelle,
    refExterne: ligne.ref,
    couleur: couleurData.libelle,
    couleurFournisseur: ligne.couleur,
    taille: tailleData.libelle,
    qte: ligne.qte,
    status: "ok",
  };
}
