import Anthropic from "@anthropic-ai/sdk";
import { LigneBL, InfoBL } from "./mapping";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractionResult {
  success: boolean;
  infoBL?: InfoBL;
  lignes?: LigneBL[];
  error?: string;
}

export async function extraireDonneesBL(
  pdfBase64: string
): Promise<ExtractionResult> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              type: "text",
              text: `Analyse ce bon de livraison et extrais les données au format JSON.

IMPORTANT: Retourne UNIQUEMENT du JSON valide, sans texte avant ou après.

Format attendu:
{
  "infoBL": {
    "refCommande": "référence de la commande (ex: IMB251213640)",
    "dateLivraison": "date au format YYYY-MM-DD",
    "fournisseur": "IMBRETEX ou RALAWISE",
    "transporteur": "nom du transporteur",
    "nbColis": nombre de colis,
    "poidsTotal": poids total en kg
  },
  "lignes": [
    {
      "ref": "référence article fournisseur (ex: JH001PHXS)",
      "designation": "description du produit",
      "couleur": "couleur EXACTE comme sur le BL (ex: DEEP BLACK, ARCTIC WHITE, DUSTY BLUE)",
      "taille": "taille (ex: XS, S, M, L, XL ou 0 pour taille unique)",
      "qte": quantité livrée (nombre)
    }
  ]
}

ATTENTION aux couleurs tronquées sur le BL:
- "MARINE GREE" = MARINE GREEN
- "NATURAL STO" = NATURAL STONE
Garde le nom EXACT tel qu'il apparaît sur le BL.

Extrais TOUTES les lignes du tableau des articles.`,
            },
          ],
        },
      ],
    });

    // Extraire le texte de la réponse
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return { success: false, error: "Pas de réponse textuelle" };
    }

    // Parser le JSON
    const jsonStr = textContent.text.trim();
    const data = JSON.parse(jsonStr);

    // Convertir la date
    if (data.infoBL && data.infoBL.dateLivraison) {
      data.infoBL.dateLivraison = new Date(data.infoBL.dateLivraison);
    }

    return {
      success: true,
      infoBL: data.infoBL,
      lignes: data.lignes,
    };
  } catch (error) {
    console.error("Erreur extraction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
