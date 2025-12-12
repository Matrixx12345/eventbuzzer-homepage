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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-warning" />
            <div>
              <h2 className="text-xl font-bold text-card-foreground">Was gefällt dir nicht?</h2>
              <p className="text-sm text-muted-foreground mt-1">{eventTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <h3 className="text-sm font-semibold text-card-foreground mb-3">
              Wähle einen Grund (Pflicht)
            </h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className={`
                    flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
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
                    className="mt-1 w-4 h-4 accent-warning"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-card-foreground">{cat.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{cat.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Text Input */}
          <div>
            <h3 className="text-sm font-semibold text-card-foreground mb-2">
              Zusätzliche Informationen (optional)
            </h3>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Teile uns weitere Details mit..."
              className="w-full p-4 border-2 border-border rounded-xl focus:border-warning focus:ring-0 resize-none bg-background text-foreground"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {feedbackText.length}/500 Zeichen
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-muted border-t border-border px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-muted-foreground font-medium hover:bg-background rounded-lg transition-colors"
            disabled={isLoading}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedCategory || isLoading}
            className="px-6 py-2 bg-warning text-warning-foreground font-medium rounded-lg hover:bg-warning/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Wird gesendet...' : 'Feedback senden'}
          </button>
        </div>
      </div>
    </div>
  );
}
