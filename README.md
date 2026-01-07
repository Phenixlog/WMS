# 🔥 Phenix WMS Tool

Outil interne pour transformer les bons de livraison fournisseurs en fichiers d'import Akanea.

## Fonctionnalités

- **📤 Upload PDF** : Glisse-dépose ton bon de livraison
- **🤖 Extraction IA** : Claude Vision extrait automatiquement les données
- **🔄 Transformation** : Conversion des références fournisseur → nomenclature interne
- **📥 Export Excel** : Génération des fichiers Akanea prêts à importer

## Modes disponibles

### 1. Bootstrap (Articles)
Crée les fiches produits dans Akanea. À utiliser une seule fois par nouveau produit.

### 2. Réception (Attendu)
Déclare un attendu de livraison dans Akanea. À utiliser à chaque réception.

## Installation

```bash
# Cloner le repo
git clone <repo-url>
cd phenix-wms-tool

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec ta clé API Anthropic

# Lancer en développement
npm run dev
```

## Configuration

### Variables d'environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `ANTHROPIC_API_KEY` | Clé API Claude pour l'extraction PDF | ✅ |

## Tables de mapping

Les tables de mapping sont définies dans `lib/mapping.ts` :

- **PRODUITS** : Référence fournisseur → Code produit interne
- **COULEURS** : Couleur fournisseur → Couleur interne
- **TAILLES** : Taille fournisseur → Taille interne
- **FOURNISSEURS** : Nom fournisseur → Code fournisseur

### Nomenclature interne

```
YP001-0001-0001-01
  │     │     │   │
  │     │     │   └── Code Fournisseur (01 = Imbretex, 02 = Ralawise)
  │     │     └────── Code Taille (0001 = XS, 0002 = S, etc.)
  │     └──────────── Code Couleur (0001 = Noir, 0002 = Blanc, etc.)
  └────────────────── Code Type Produit (YP001 = Sweat capuche, etc.)
```

## Déploiement

### Vercel (recommandé)

```bash
npm install -g vercel
vercel
```

### Docker

```bash
docker build -t phenix-wms-tool .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=xxx phenix-wms-tool
```

## Stack technique

- **Next.js 14** - Framework React
- **Tailwind CSS** - Styling
- **Claude Vision** - Extraction PDF
- **ExcelJS** - Génération Excel

## Évolutions prévues

- [ ] Stockage des mappings dans Supabase
- [ ] Historique des imports
- [ ] Interface d'édition des mappings
- [ ] Support multi-fournisseurs dynamique

---

Made with ❤️ for Phenix Store
