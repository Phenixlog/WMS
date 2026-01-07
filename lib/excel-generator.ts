import ExcelJS from "exceljs";
import { LigneTransformee, InfoBL, VALEURS_FIXES, PRODUITS, COULEURS, TAILLES } from "./mapping";

// Positions des colonnes pour le fichier Bootstrap (Articles)
const COL_BOOTSTRAP = {
  TYPE_OP: 4,
  STOCKEUR: 5,
  CODE_ARTICLE: 6,
  LIBELLE: 7,
  REF_EXTERNE: 9,
  FAMILLE: 10,
  STOCK_ALERTE: 13,
  ARTICLE_NOUVEAU: 16,
  DEPOT: 66,
  ZONE: 67,
  GENCOD: 94,
  TYPE_MVT: 101,
  TAILLE: 121,
  COULEUR: 122,
  COLORIS_FOURN: 123,
};

// Positions des colonnes pour le fichier Réception
const COL_RECEPTION_ENTETE = {
  STOCKEUR: 4,
  AGENCE: 5,
  NUM_COMMANDE: 6,
  TYPE_RECEPTION: 7,
  NOM_FOURNISSEUR: 11,
  NOM_TRANSPORTEUR: 15,
  DATE_RECEPTION: 25,
  COMMENTAIRE: 38,
};

const COL_RECEPTION_LIGNES = {
  NUM_COMMANDE: 4,
  CODE_ARTICLE: 6,
  QTE_UVC: 15,
};

// Générer le fichier Bootstrap (création d'articles)
export async function genererBootstrap(
  lignes: LigneTransformee[],
  templateBuffer: ArrayBuffer
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const sheet = workbook.getWorksheet("Articles à intégrer");
  if (!sheet) throw new Error("Onglet 'Articles à intégrer' non trouvé");

  const startRow = 16;

  lignes.forEach((ligne, i) => {
    const row = startRow + i;

    sheet.getCell(row, COL_BOOTSTRAP.TYPE_OP).value = VALEURS_FIXES.type_operation;
    sheet.getCell(row, COL_BOOTSTRAP.STOCKEUR).value = VALEURS_FIXES.stockeur;
    sheet.getCell(row, COL_BOOTSTRAP.CODE_ARTICLE).value = ligne.codeArticle;
    sheet.getCell(row, COL_BOOTSTRAP.LIBELLE).value = ligne.libelle;
    sheet.getCell(row, COL_BOOTSTRAP.REF_EXTERNE).value = ligne.refExterne;
    sheet.getCell(row, COL_BOOTSTRAP.FAMILLE).value = VALEURS_FIXES.famille;
    sheet.getCell(row, COL_BOOTSTRAP.STOCK_ALERTE).value = 1;
    sheet.getCell(row, COL_BOOTSTRAP.ARTICLE_NOUVEAU).value = VALEURS_FIXES.article_nouveau;
    sheet.getCell(row, COL_BOOTSTRAP.DEPOT).value = VALEURS_FIXES.depot;
    sheet.getCell(row, COL_BOOTSTRAP.ZONE).value = VALEURS_FIXES.zone;
    sheet.getCell(row, COL_BOOTSTRAP.GENCOD).value = VALEURS_FIXES.gencod;
    sheet.getCell(row, COL_BOOTSTRAP.TYPE_MVT).value = VALEURS_FIXES.type_mouvement;
    sheet.getCell(row, COL_BOOTSTRAP.TAILLE).value = ligne.taille;
    sheet.getCell(row, COL_BOOTSTRAP.COULEUR).value = ligne.couleur;
    sheet.getCell(row, COL_BOOTSTRAP.COLORIS_FOURN).value = ligne.couleurFournisseur;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// Générer le fichier Réception (attendu de livraison)
export async function genererReception(
  infoBL: InfoBL,
  lignes: LigneTransformee[],
  templateBuffer: ArrayBuffer
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  // Onglet Entête
  const sheetEntete = workbook.getWorksheet("Entête Réception");
  if (!sheetEntete) throw new Error("Onglet 'Entête Réception' non trouvé");

  const rowEntete = 8;
  sheetEntete.getCell(rowEntete, COL_RECEPTION_ENTETE.STOCKEUR).value = VALEURS_FIXES.stockeur;
  sheetEntete.getCell(rowEntete, COL_RECEPTION_ENTETE.AGENCE).value = VALEURS_FIXES.agence;
  sheetEntete.getCell(rowEntete, COL_RECEPTION_ENTETE.NUM_COMMANDE).value = infoBL.refCommande;
  sheetEntete.getCell(rowEntete, COL_RECEPTION_ENTETE.TYPE_RECEPTION).value = "ENT";
  sheetEntete.getCell(rowEntete, COL_RECEPTION_ENTETE.NOM_FOURNISSEUR).value = infoBL.fournisseur;
  sheetEntete.getCell(rowEntete, COL_RECEPTION_ENTETE.NOM_TRANSPORTEUR).value = infoBL.transporteur;
  sheetEntete.getCell(rowEntete, COL_RECEPTION_ENTETE.DATE_RECEPTION).value = infoBL.dateLivraison;
  sheetEntete.getCell(rowEntete, COL_RECEPTION_ENTETE.COMMENTAIRE).value = 
    `BL ${infoBL.refCommande} - ${infoBL.nbColis} colis - ${infoBL.poidsTotal}kg`;

  // Onglet Lignes
  const sheetLignes = workbook.getWorksheet("Lignes de Commandes");
  if (!sheetLignes) throw new Error("Onglet 'Lignes de Commandes' non trouvé");

  const startRowLignes = 14;

  lignes.forEach((ligne, i) => {
    const row = startRowLignes + i;

    sheetLignes.getCell(row, COL_RECEPTION_LIGNES.NUM_COMMANDE).value = infoBL.refCommande;
    sheetLignes.getCell(row, COL_RECEPTION_LIGNES.CODE_ARTICLE).value = ligne.codeArticle;
    sheetLignes.getCell(row, COL_RECEPTION_LIGNES.QTE_UVC).value = ligne.qte;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
