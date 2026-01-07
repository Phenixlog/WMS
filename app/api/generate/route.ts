import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { LigneTransformee, VALEURS_FIXES } from "@/lib/mapping";

interface InfoBL {
  refCommande: string;
  dateLivraison: string;
  fournisseur: string;
  transporteur: string;
  nbColis: number;
  poidsTotal: number;
}

interface RequestBody {
  mode: "bootstrap" | "reception";
  infoBL: InfoBL;
  lignes: LigneTransformee[];
}

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

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { mode, infoBL, lignes } = body;

    // Créer un nouveau workbook
    const workbook = new ExcelJS.Workbook();

    if (mode === "bootstrap") {
      // Créer le fichier Bootstrap
      const sheet = workbook.addWorksheet("Articles à intégrer");

      // Ajouter les headers (ligne 9)
      const headers = [
        "", "", "", "Type opération", "Stockeur", "Code Article", "Libellé Article",
        "", "Référence externe", "Famille", "", "", "Stock d'Alerte en UVC", "", "",
        "Article Nouveau"
      ];
      
      // Pour simplifier, on crée un fichier CSV-like
      // Header row
      sheet.getRow(1).values = [
        "Type opération", "Stockeur", "Code Article", "Libellé Article",
        "Référence externe", "Famille", "Stock d'Alerte", "Article Nouveau",
        "Dépôt", "Zone", "Gencod", "Type Mouvement", "Taille", "Couleur", "Coloris fournisseur"
      ];

      // Style header
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Ajouter les données
      lignes.forEach((ligne, i) => {
        const row = i + 2;
        sheet.getRow(row).values = [
          VALEURS_FIXES.type_operation,
          VALEURS_FIXES.stockeur,
          ligne.codeArticle,
          ligne.libelle,
          ligne.refExterne,
          VALEURS_FIXES.famille,
          1,
          VALEURS_FIXES.article_nouveau,
          VALEURS_FIXES.depot,
          VALEURS_FIXES.zone,
          VALEURS_FIXES.gencod,
          VALEURS_FIXES.type_mouvement,
          ligne.taille,
          ligne.couleur,
          ligne.couleurFournisseur,
        ];
      });

      // Auto-width columns
      sheet.columns.forEach((column) => {
        column.width = 18;
      });

    } else {
      // Créer le fichier Réception avec 2 onglets
      
      // Onglet Entête
      const sheetEntete = workbook.addWorksheet("Entête Réception");
      sheetEntete.getRow(1).values = [
        "Stockeur", "Agence", "N° Commande", "Type", "Fournisseur",
        "Transporteur", "Date réception", "Commentaire"
      ];
      sheetEntete.getRow(1).font = { bold: true };
      sheetEntete.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      sheetEntete.getRow(2).values = [
        VALEURS_FIXES.stockeur,
        VALEURS_FIXES.agence,
        infoBL.refCommande,
        "ENT",
        infoBL.fournisseur,
        infoBL.transporteur,
        new Date(infoBL.dateLivraison),
        `BL ${infoBL.refCommande} - ${infoBL.nbColis} colis - ${infoBL.poidsTotal}kg`,
      ];

      sheetEntete.columns.forEach((column) => {
        column.width = 20;
      });

      // Onglet Lignes
      const sheetLignes = workbook.addWorksheet("Lignes de Commandes");
      sheetLignes.getRow(1).values = [
        "N° Commande", "Code Article", "Quantité UVC"
      ];
      sheetLignes.getRow(1).font = { bold: true };
      sheetLignes.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      lignes.forEach((ligne, i) => {
        const row = i + 2;
        sheetLignes.getRow(row).values = [
          infoBL.refCommande,
          ligne.codeArticle,
          ligne.qte,
        ];
      });

      sheetLignes.columns.forEach((column) => {
        column.width = 25;
      });
    }

    // Générer le buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Retourner le fichier
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${mode}_${infoBL.refCommande}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Erreur génération:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
