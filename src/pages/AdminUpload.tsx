import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { uploadAllAssetsToStorage } from "@/utils/uploadAssetsToStorage";
import { CheckCircle, XCircle, Upload, Loader2, Heart, ThumbsDown, BarChart3 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


interface EventRating {
  id: string;
  title: string;
  tags: string[] | null;
  likes_count: number;
  dislikes_count: number;
  quality_score: number;
  total_ratings: number;
}

const AdminUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, filename: "" });
  const [results, setResults] = useState<{ success: string[]; failed: string[] } | null>(null);

  // Ratings state
  const [ratings, setRatings] = useState<EventRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [ratingsError, setRatingsError] = useState<string | null>(null);

  const handleUpload = async () => {
    setIsUploading(true);
    setResults(null);

    const result = await uploadAllAssetsToStorage((current, total, filename) => {
      setProgress({ current, total, filename });
    });

    setResults(result);
    setIsUploading(false);
  };

  // Fetch ratings via Edge Function
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-event-ratings`
        );
        const result = await response.json();
        
        if (!result.success) {
          setRatingsError(result.error || "Fehler beim Laden");
          return;
        }

        // Sort client-side by total_ratings
        const sorted = (result.data || []).sort(
          (a: EventRating, b: EventRating) => b.total_ratings - a.total_ratings
        );

        setRatings(sorted);
      } catch (err) {
        console.error("Fetch error:", err);
        setRatingsError("Fehler beim Laden der Ratings");
      } finally {
        setLoadingRatings(false);
      }
    };

    fetchRatings();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
          Admin Tools
        </h1>
        <p className="text-muted-foreground mb-8">
          Bildkatalog Upload & Event Ratings.
        </p>

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
          <div className="space-y-4 mb-6">
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

        {/* Event Ratings Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Event Ratings
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Events mit Bewertungen, sortiert nach Quality Score.
          </p>

          {loadingRatings ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Lade Ratings...</span>
            </div>
          ) : ratingsError ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-600 text-sm">
              {ratingsError}
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Keine Events mit Ratings gefunden.
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-medium text-xs">Event</TableHead>
                    <TableHead className="text-center w-20 text-xs">
                      <Heart size={12} className="inline mr-1 text-red-500" />
                      Likes
                    </TableHead>
                    <TableHead className="text-center w-20 text-xs">
                      <ThumbsDown size={12} className="inline mr-1" strokeWidth={2.5} />
                      Dislikes
                    </TableHead>
                    <TableHead className="text-center w-24 text-xs">Score</TableHead>
                    <TableHead className="text-center w-20 text-xs">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratings.map((event) => (
                    <TableRow key={event.id} className="hover:bg-muted/30">
                      <TableCell className="py-2">
                        <Link 
                          to={`/event/${event.id}`}
                          className="text-foreground hover:text-blue-600 transition-colors text-sm font-medium"
                        >
                          {event.title}
                        </Link>
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {event.tags.slice(0, 2).map((tag, i) => (
                              <span 
                                key={i}
                                className="text-[9px] bg-muted text-muted-foreground px-1 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm text-foreground">
                        {event.likes_count}
                      </TableCell>
                      <TableCell className="text-center text-sm text-foreground">
                        {event.dislikes_count}
                      </TableCell>
                      <TableCell className="text-center">
                        <span 
                          className={`text-sm font-medium ${
                            event.quality_score >= 0.7 
                              ? 'text-emerald-600' 
                              : event.quality_score >= 0.4 
                                ? 'text-amber-600' 
                                : 'text-red-600'
                          }`}
                        >
                          {(event.quality_score * 100).toFixed(0)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium text-foreground">
                        {event.total_ratings}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUpload;
