import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { uploadAllAssetsToStorage } from "@/utils/uploadAssetsToStorage";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, XCircle, Upload, Loader2, Heart, ThumbsDown, BarChart3, Trash2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";


interface EventRating {
  id: string;
  title: string;
  tags: string[] | null;
  likes_count: number;
  dislikes_count: number;
  quality_score: number;
  total_ratings: number;
  feedback_categories: string[] | null;
  feedback_texts: string[] | null;
}

const FILTER_OPTIONS = [
  { key: "all", label: "Alle" },
  { key: "wrong-category", label: "Wrong Category" },
  { key: "poor-quality", label: "Poor Quality" },
  { key: "duplicate", label: "Duplicate" },
  { key: "outdated", label: "Outdated" },
  { key: "inappropriate", label: "Inappropriate" },
];

// Admin emails allowed to access admin pages
const ADMIN_EMAILS = ["eventbuzzer1@gmail.com", "j.straton111@gmail.com"];

const AdminUpload = () => {
  const { user } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, filename: "" });
  const [results, setResults] = useState<{ success: string[]; failed: string[] } | null>(null);

  // Ratings state
  const [ratings, setRatings] = useState<EventRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(true);

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }
  const [ratingsError, setRatingsError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  
  // Action states
  const [editingEvent, setEditingEvent] = useState<EventRating | null>(null);
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSavingTags, setIsSavingTags] = useState(false);

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

  const filteredRatings = ratings.filter((event) => {
    if (activeFilter === "all") return true;
    return event.feedback_categories?.some(
      (cat) => cat === activeFilter
    );
  });

  const handleDelete = async (eventId: string) => {
    if (!confirm("Event wirklich löschen?")) return;
    
    setIsDeleting(eventId);
    try {
      const response = await fetch(
        `https://tfkiyvhfhvkejpljsnrk.supabase.co/functions/v1/delete-event`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: eventId }),
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setRatings((prev) => prev.filter((e) => e.id !== eventId));
        toast.success("Event gelöscht");
      } else {
        toast.error(data.error || "Fehler beim Löschen");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Fehler beim Löschen");
    } finally {
      setIsDeleting(null);
    }
  };

  const openTagEditor = (event: EventRating) => {
    setEditingEvent(event);
    setEditedTags(event.tags || []);
    setNewTag("");
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditedTags(editedTags.filter((t) => t !== tag));
  };

  const handleSaveTags = async () => {
    if (!editingEvent) return;
    
    setIsSavingTags(true);
    try {
      const response = await fetch(
        `https://tfkiyvhfhvkejpljsnrk.supabase.co/functions/v1/update-event-tags`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: editingEvent.id, tags: editedTags }),
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setRatings((prev) =>
          prev.map((e) =>
            e.id === editingEvent.id ? { ...e, tags: editedTags } : e
          )
        );
        toast.success("Tags gespeichert");
        setEditingEvent(null);
      } else {
        toast.error(data.error || "Fehler beim Speichern");
      }
    } catch (err) {
      console.error("Save tags error:", err);
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSavingTags(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-5xl mx-auto">
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

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTER_OPTIONS.map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {loadingRatings ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Lade Ratings...</span>
            </div>
          ) : ratingsError ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-600 text-sm">
              {ratingsError}
            </div>
          ) : filteredRatings.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Keine Events gefunden.
            </div>
          ) : (
            <>
              <div className="border border-border rounded-lg overflow-hidden bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white">
                      <TableHead className="font-medium text-xs">Event</TableHead>
                      <TableHead className="text-center w-16 text-xs">
                        <Heart size={12} className="inline mr-1 text-red-500" />
                      </TableHead>
                      <TableHead className="text-center w-16 text-xs">
                        <ThumbsDown size={12} className="inline mr-1" strokeWidth={2.5} />
                      </TableHead>
                      <TableHead className="text-center w-20 text-xs">Score</TableHead>
                      <TableHead className="text-xs min-w-[150px]">Feedback</TableHead>
                      <TableHead className="text-xs w-24">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRatings.map((event) => (
                      <TableRow key={event.id} className="bg-white hover:bg-gray-50">
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
                        <TableCell>
                          {event.feedback_categories && event.feedback_categories.length > 0 ? (
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1">
                                {event.feedback_categories.map((cat, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0">
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                              {event.feedback_texts && event.feedback_texts.length > 0 && (
                                <div className="text-[10px] text-muted-foreground">
                                  {event.feedback_texts.slice(0, 1).map((text, idx) => (
                                    <div key={idx} className="italic truncate max-w-[120px]">"{text}"</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openTagEditor(event)}
                              title="Tags bearbeiten"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(event.id)}
                              disabled={isDeleting === event.id}
                              title="Löschen"
                            >
                              {isDeleting === event.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-3 text-xs text-muted-foreground text-center">
                {filteredRatings.length} von {ratings.length} Events
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tag Editor Modal */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tags bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{editingEvent?.title}</p>
            
            <div className="flex flex-wrap gap-2">
              {editedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                id="new-tag-input"
                name="newTag"
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                placeholder="Neuer Tag..."
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button variant="outline" size="sm" onClick={handleAddTag}>
                Hinzufügen
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingEvent(null)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveTags} disabled={isSavingTags}>
                {isSavingTags ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUpload;
