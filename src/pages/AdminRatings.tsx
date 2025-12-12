import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ArrowLeft, ThumbsUp, ThumbsDown, AlertTriangle, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface EventRating {
  id: string;
  title: string;
  tags: string[] | null;
  likes_count: number;
  dislikes_count: number;
  total_ratings: number;
  quality_score: number;
  wrong_category_count: number;
}

export default function AdminRatings() {
  const [ratings, setRatings] = useState<EventRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-event-ratings`
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

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return "text-success";
    if (score >= 0.4) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
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
        ) : ratings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Noch keine Ratings vorhanden</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Event</TableHead>
                  <TableHead className="text-center">
                    <ThumbsUp className="w-4 h-4 inline" />
                  </TableHead>
                  <TableHead className="text-center">
                    <ThumbsDown className="w-4 h-4 inline" />
                  </TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">
                    <span title="Wrong Category Count">Falsche Kat.</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratings.map((event) => (
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
                    <TableCell className="text-center">
                      {event.wrong_category_count > 0 ? (
                        <span className="text-warning font-medium">
                          {event.wrong_category_count}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
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
            {ratings.length} Events mit Ratings · Sortiert nach Quality Score (niedrigste zuerst)
          </div>
        )}
      </main>
    </div>
  );
}
