import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface FeedbackModalProps {
  eventTitle: string;
  onClose: () => void;
  onSubmit: (category: string, text: string) => void;
  isLoading: boolean;
}

export function FeedbackModal({ eventTitle, onClose, onSubmit, isLoading }: FeedbackModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState('');

  const categories = [
    { id: 'wrong-category', label: 'Falsche Kategorie', description: 'Event passt nicht zur Kategorie' },
    { id: 'duplicate', label: 'Duplikat', description: 'Event existiert bereits mehrfach' },
    { id: 'outdated', label: 'Veraltet', description: 'Event ist nicht mehr aktuell' },
    { id: 'inappropriate', label: 'Unangemessen', description: 'Spam oder unpassender Inhalt' },
    { id: 'poor-quality', label: 'Schlechte Qualität', description: 'Beschreibung oder Bilder fehlen' },
    { id: 'other', label: 'Anderer Grund', description: 'Bitte unten beschreiben' },
  ];

  const handleSubmit = () => {
    if (!selectedCategory) return;
    onSubmit(selectedCategory, feedbackText);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div 
        className="bg-card rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            <div>
              <h2 className="text-base font-bold text-card-foreground">Was gefällt dir nicht?</h2>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{eventTitle}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Category Selection */}
          <div>
            <h3 className="text-xs font-semibold text-card-foreground mb-2">
              Wähle einen Grund (Pflicht)
            </h3>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className={`
                    flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm
                    ${selectedCategory === cat.id 
                      ? 'border-warning bg-warning/10' 
                      : 'border-border hover:border-muted-foreground bg-card'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.id}
                    checked={selectedCategory === cat.id}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="mt-0.5 w-3.5 h-3.5 accent-warning"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-card-foreground text-sm">{cat.label}</div>
                    <div className="text-xs text-muted-foreground">{cat.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Text Input */}
          <div>
            <h3 className="text-xs font-semibold text-card-foreground mb-1.5">
              Zusätzliche Informationen (optional)
            </h3>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Teile uns weitere Details mit..."
              className="w-full p-3 border border-border rounded-lg focus:border-warning focus:ring-0 resize-none bg-background text-foreground text-sm"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {feedbackText.length}/500 Zeichen
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-muted border-t border-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-1.5 text-muted-foreground text-sm font-medium hover:bg-background rounded-lg transition-colors"
            disabled={isLoading}
          >
            Abbrechen
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSubmit();
            }}
            disabled={!selectedCategory || isLoading}
            className="px-4 py-1.5 bg-warning text-warning-foreground text-sm font-medium rounded-lg hover:bg-warning/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Wird gesendet...' : 'Feedback senden'}
          </button>
        </div>
      </div>
    </div>
  );
}
