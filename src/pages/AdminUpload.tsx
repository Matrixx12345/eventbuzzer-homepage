import { useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadAllAssetsToStorage } from "@/utils/uploadAssetsToStorage";
import { CheckCircle, XCircle, Upload, Loader2, MapPin, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, filename: "" });
  const [results, setResults] = useState<{ success: string[]; failed: string[] } | null>(null);
  
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleUpload = async () => {
    setIsUploading(true);
    setResults(null);

    const result = await uploadAllAssetsToStorage((current, total, filename) => {
      setProgress({ current, total, filename });
    });

    setResults(result);
    setIsUploading(false);
  };

  const handleMySwitzerlandImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    toast.info("MySwitzerland Import gestartet...");

    try {
      const { data, error } = await supabase.functions.invoke('myswitzerland-import', {
        body: {}
      });

      if (error) {
        console.error("Import error:", error);
        toast.error("Import fehlgeschlagen: " + error.message);
        setImportResult({ success: false, error: error.message });
      } else {
        console.log("Import result:", data);
        toast.success(`Import erfolgreich: ${data.imported} Events importiert`);
        setImportResult(data);
      }
    } catch (e) {
      console.error("Import exception:", e);
      toast.error("Import fehlgeschlagen");
      setImportResult({ success: false, error: String(e) });
    }

    setIsImporting(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
          Admin Tools
        </h1>
        <p className="text-muted-foreground mb-8">
          Bildkatalog Upload und Event-Import Funktionen.
        </p>

        {/* MySwitzerland Import Section */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            MySwitzerland Import
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Importiert Attraktionen, Angebote und Touren von der MySwitzerland OpenData API.
          </p>
          
          <Button
            onClick={handleMySwitzerlandImport}
            disabled={isImporting}
            variant="default"
            className="w-full mb-4"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Importiere...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                MySwitzerland Events importieren
              </>
            )}
          </Button>

          {importResult && (
            <div className={`rounded-lg p-4 text-sm ${
              importResult.success 
                ? "bg-green-500/10 border border-green-500/20 text-green-700" 
                : "bg-red-500/10 border border-red-500/20 text-red-700"
            }`}>
              {importResult.success ? (
                <>
                  <div className="font-semibold">✓ Import erfolgreich</div>
                  <div>Gefunden: {importResult.total_found} Items</div>
                  <div>Importiert: {importResult.imported} Events</div>
                </>
              ) : (
                <>
                  <div className="font-semibold">✗ Import fehlgeschlagen</div>
                  <div>{importResult.error}</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bildkatalog Upload Section */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-500" />
            Bildkatalog Upload
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Lädt alle 33 Event-Bilder in den Supabase Storage.
          </p>
          
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
            <div>• concert (4 Bilder)</div>
            <div>• theater (2 Bilder)</div>
            <div>• museum (4 Bilder)</div>
            <div>• wellness (1 Bild)</div>
            <div>• cinema (1 Bild)</div>
            <div>• comedy (1 Bild)</div>
            <div>• food (1 Bild)</div>
            <div>• city (5 Bilder)</div>
            <div>• nature (4 Bilder)</div>
            <div>• general (1 Bild)</div>
            <div>• partner (4 Bilder)</div>
            <div>• festival (5 Bilder)</div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading}
            variant="outline"
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uploading... ({progress.current}/{progress.total})
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Alle Bilder hochladen
              </>
            )}
          </Button>
        </div>

        {isUploading && (
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <div className="text-sm text-muted-foreground mb-2">
              Aktuell: {progress.filename}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 font-semibold mb-2">
                <CheckCircle className="h-5 w-5" />
                Erfolgreich: {results.success.length} Bilder
              </div>
              <div className="text-sm text-muted-foreground max-h-40 overflow-y-auto">
                {results.success.map((file) => (
                  <div key={file}>✓ {file}</div>
                ))}
              </div>
            </div>

            {results.failed.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600 font-semibold mb-2">
                  <XCircle className="h-5 w-5" />
                  Fehlgeschlagen: {results.failed.length} Bilder
                </div>
                <div className="text-sm text-muted-foreground">
                  {results.failed.map((file) => (
                    <div key={file}>✗ {file}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUpload;
