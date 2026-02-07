import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { ArrowLeft, ThumbsUp, ThumbsDown, AlertTriangle, Loader2, Trash2, Tag } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  total_ratings: number;
  quality_score: number;
  feedback_categories: string[] | null;
  feedback_texts: string[] | null;
}

const FILTER_OPTIONS = [
  { key: "all", label: "Alle" },
  { key: "wrong_category", label: "Wrong Category" },
  { key: "poor_quality", label: "Poor Quality" },
  { key: "duplicate", label: "Duplicate" },
  { key: "outdated", label: "Outdated" },
  { key: "inappropriate", label: "Inappropriate" },
];

export default function AdminRatings() {
  const [ratings, setRatings] = useState<EventRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [editingEvent, setEditingEvent] = useState<EventRating | null>(null);
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSavingTags, setIsSavingTags] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const response = await fetch(
        `https://tfkiyvhfhvkejpljsnrk.supabase.co/functions/v1/get-event-ratings`
      );
      const data = await response.json();
      
      if (data.success) {
        setRatings(data.data);
      } else {
        setError(data.error || "Failed to fetch ratings");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Fehler beim Laden der Ratings");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRatings = ratings.filter((event) => {
    if (activeFilter === "all") return true;
    return event.feedback_categories?.some(
      (cat) => cat.toLowerCase().replace(/\s+/g, "_") === activeFilter
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

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return "text-success";
    if (score >= 0.4) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin-upload"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Event Ratings</h1>
            <p className="text-muted-foreground text-sm">
              Übersicht aller Events mit Nutzerbewertungen
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
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

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error}</p>
          </div>
        ) : filteredRatings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Keine Events gefunden</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Event</TableHead>
                  <TableHead className="text-center">
                    <ThumbsUp className="w-4 h-4 inline" />
                  </TableHead>
                  <TableHead className="text-center">
                    <ThumbsDown className="w-4 h-4 inline" />
                  </TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="min-w-[180px]">Feedback</TableHead>
                  <TableHead className="w-[120px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRatings.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Link
                        to={`/event/${event.id}`}
                        className="hover:text-primary transition-colors font-medium"
                      >
                        {event.title}
                      </Link>
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {event.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-success font-medium">
                        {event.likes_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-destructive font-medium">
                        {event.dislikes_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${getScoreColor(event.quality_score)}`}>
                        {(event.quality_score * 100).toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {event.feedback_categories && event.feedback_categories.length > 0 ? (
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {event.feedback_categories.map((cat, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                          {event.feedback_texts && event.feedback_texts.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {event.feedback_texts.map((text, idx) => (
                                <div key={idx} className="italic">"{text}"</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openTagEditor(event)}
                          title="Tags bearbeiten"
                        >
                          <Tag className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(event.id)}
                          disabled={isDeleting === event.id}
                          title="Löschen"
                        >
                          {isDeleting === event.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Stats Summary */}
        {!isLoading && !error && ratings.length > 0 && (
          <div className="mt-6 text-sm text-muted-foreground text-center">
            {filteredRatings.length} von {ratings.length} Events · Sortiert nach Quality Score
          </div>
        )}
      </main>

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
                id="new-tag-ratings"
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
}
