"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Download, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface LigneTransformee {
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

interface InfoBL {
  refCommande: string;
  dateLivraison: string;
  fournisseur: string;
  transporteur: string;
  nbColis: number;
  poidsTotal: number;
}

interface ExtractionResult {
  success: boolean;
  infoBL?: InfoBL;
  lignes?: LigneTransformee[];
  error?: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [mode, setMode] = useState<"bootstrap" | "reception">("reception");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
      setResult(null);
    },
  });

  const handleExtract = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Erreur lors de l'extraction",
      });
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!result?.success || !result.infoBL) return;

    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          infoBL: result.infoBL,
          lignes: result.lignes,
        }),
      });

      if (!response.ok) throw new Error("Erreur génération");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = mode === "bootstrap" 
        ? `BOOTSTRAP_${result.infoBL.refCommande}.xlsx`
        : `RECEPTION_${result.infoBL.refCommande}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Erreur lors de la génération du fichier");
    }
    setLoading(false);
  };

  const lignesOk = result?.lignes?.filter((l) => l.status === "ok") || [];
  const lignesError = result?.lignes?.filter((l) => l.status === "error") || [];
  const totalQte = result?.lignes?.reduce((acc, l) => acc + l.qte, 0) || 0;

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔥 Phenix WMS Tool
        </h1>
        <p className="text-gray-600">
          Transforme tes bons de livraison en fichiers Akanea
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-lg p-1 shadow-sm border">
          <button
            onClick={() => setMode("reception")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "reception"
                ? "bg-phenix-500 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📦 Réception (Attendu)
          </button>
          <button
            onClick={() => setMode("bootstrap")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "bootstrap"
                ? "bg-phenix-500 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🏗️ Bootstrap (Articles)
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-phenix-500 bg-phenix-50"
            : file
            ? "border-green-500 bg-green-50"
            : "border-gray-300 bg-white hover:border-phenix-400"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(1)} Ko
              </p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {isDragActive
                ? "Dépose le fichier ici..."
                : "Glisse ton bon de livraison PDF ici"}
            </p>
            <p className="text-sm text-gray-400">ou clique pour sélectionner</p>
          </>
        )}
      </div>

      {/* Extract Button */}
      {file && !result && (
        <div className="mt-6 text-center">
          <button
            onClick={handleExtract}
            disabled={loading}
            className="bg-phenix-500 hover:bg-phenix-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Extraction en cours...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Extraire les données
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Error */}
          {!result.success && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Erreur d'extraction</p>
                <p className="text-sm text-red-600">{result.error}</p>
              </div>
            </div>
          )}

          {/* Success */}
          {result.success && result.infoBL && (
            <>
              {/* BL Info */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="font-semibold text-gray-900 mb-3">
                  📋 Informations du BL
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Référence</span>
                    <p className="font-medium">{result.infoBL.refCommande}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Fournisseur</span>
                    <p className="font-medium">{result.infoBL.fournisseur}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date</span>
                    <p className="font-medium">
                      {new Date(result.infoBL.dateLivraison).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Transporteur</span>
                    <p className="font-medium">{result.infoBL.transporteur}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Colis</span>
                    <p className="font-medium">{result.infoBL.nbColis}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Poids total</span>
                    <p className="font-medium">{result.infoBL.poidsTotal} kg</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{result.lignes?.length}</p>
                  <p className="text-sm text-gray-500">Articles</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{lignesOk.length}</p>
                  <p className="text-sm text-gray-500">OK</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{lignesError.length}</p>
                  <p className="text-sm text-gray-500">Erreurs</p>
                </div>
              </div>

              {/* Lines Table */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-900">
                    📦 Détail des articles ({totalQte} pièces)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="px-4 py-2 font-medium text-gray-600">Status</th>
                        <th className="px-4 py-2 font-medium text-gray-600">Code Article</th>
                        <th className="px-4 py-2 font-medium text-gray-600">Libellé</th>
                        <th className="px-4 py-2 font-medium text-gray-600">Taille</th>
                        <th className="px-4 py-2 font-medium text-gray-600">Couleur</th>
                        <th className="px-4 py-2 font-medium text-gray-600 text-right">Qté</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.lignes?.map((ligne, i) => (
                        <tr
                          key={i}
                          className={ligne.status === "error" ? "bg-red-50" : ""}
                        >
                          <td className="px-4 py-2">
                            {ligne.status === "ok" ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">
                            {ligne.codeArticle}
                          </td>
                          <td className="px-4 py-2">{ligne.libelle}</td>
                          <td className="px-4 py-2">{ligne.taille}</td>
                          <td className="px-4 py-2">
                            <span className="text-gray-900">{ligne.couleur}</span>
                            <span className="text-gray-400 text-xs ml-1">
                              ({ligne.couleurFournisseur})
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {ligne.qte}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Errors Detail */}
              {lignesError.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-2">
                    ⚠️ Erreurs à corriger
                  </h3>
                  <ul className="text-sm text-red-600 space-y-1">
                    {lignesError.map((ligne, i) => (
                      <li key={i}>
                        <span className="font-mono">{ligne.refExterne}</span>:{" "}
                        {ligne.errorMessage}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Download Button */}
              <div className="text-center">
                <button
                  onClick={handleDownload}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Télécharger le fichier {mode === "bootstrap" ? "Bootstrap" : "Réception"}
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  {mode === "bootstrap"
                    ? "Fichier pour créer les fiches articles dans Akanea"
                    : "Fichier pour déclarer l'attendu de livraison dans Akanea"}
                </p>
              </div>

              {/* Reset */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Traiter un autre BL
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
