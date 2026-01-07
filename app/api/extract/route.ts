import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { transformerLigne, LigneBL } from "@/lib/mapping";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const mode = formData.get("mode") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Convertir le fichier en base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Appeler Claude pour extraire les données
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

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
                data: base64,
              },
            },
            {
              type: "text",
              text: `Analyse ce bon de livraison et extrais les données au format JSON.

IMPORTANT: Retourne UNIQUEMENT du JSON valide, sans texte avant ou après, sans backticks.

Format attendu:
{
  "infoBL": {
    "refCommande": "référence de la commande (ex: IMB251213640)",
    "dateLivraison": "date au format YYYY-MM-DD",
    "fournisseur": "IMBRETEX ou RALAWISE",
    "transporteur": "nom du transporteur",
    "nbColis": nombre de colis (integer),
    "poidsTotal": poids total en kg (number)
  },
  "lignes": [
    {
      "ref": "référence article fournisseur (ex: JH001PHXS)",
      "designation": "description du produit",
      "couleur": "couleur EXACTE comme sur le BL",
      "taille": "taille (ex: XS, S, M, L, XL ou 0 pour taille unique)",
      "qte": quantité livrée (integer)
    }
  ]
}

ATTENTION: 
- Garde les couleurs EXACTEMENT comme sur le BL (ex: "MARINE GREE", "NATURAL STO")
- La taille "0" signifie taille unique
- Extrais TOUTES les lignes du tableau`,
            },
          ],
        },
      ],
    });

    // Extraire le texte de la réponse
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { success: false, error: "Pas de réponse de Claude" },
        { status: 500 }
      );
    }

    // Parser le JSON (nettoyer les éventuels backticks)
    let jsonStr = textContent.text.trim();
    jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    const data = JSON.parse(jsonStr);

    // Transformer les lignes avec notre mapping
    const fournisseur = data.infoBL?.fournisseur || "IMBRETEX";
    const lignesTransformees = data.lignes.map((ligne: LigneBL) =>
      transformerLigne(ligne, fournisseur)
    );

    return NextResponse.json({
      success: true,
      infoBL: data.infoBL,
      lignes: lignesTransformees,
    });
  } catch (error) {
    console.error("Erreur extraction:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
