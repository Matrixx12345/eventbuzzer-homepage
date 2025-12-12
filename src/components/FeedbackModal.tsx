import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

interface FeedbackModalProps {
  eventTitle: string;
  onClose: () => void;
  onSubmit: (category: string) => void;
  isLoading: boolean;
}

export function FeedbackModal({ eventTitle, onClose, onSubmit, isLoading }: FeedbackModalProps) {
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: 'wrong-category', label: 'Falsche Kategorie' },
    { id: 'duplicate', label: 'Duplikat' },
    { id: 'outdated', label: 'Veraltet' },
    { id: 'inappropriate', label: 'Unangemessen' },
    { id: 'poor-quality', label: 'Schlechte Qualität' },
    { id: 'other', label: 'Anderer Grund' },
  ];

  const handleSelect = (categoryId: string) => {
    if (isLoading || submitted) return;
    setSubmitted(true);
    
    // Show thank you briefly then submit
    setTimeout(() => {
      onSubmit(categoryId);
    }, 1200);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading && !submitted) onClose();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-card rounded-xl w-full max-w-xs shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          // Thank you message
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-card-foreground font-medium">Vielen Dank!</p>
            <p className="text-muted-foreground text-sm mt-1">Dein Feedback hilft uns</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-card-foreground">Was stimmt nicht?</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1 hover:bg-muted rounded transition-colors"
                disabled={isLoading}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Options - click to select and submit */}
            <div className="p-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(cat.id);
                  }}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-card-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Render as portal to avoid event bubbling issues
  return createPortal(modalContent, document.body);
}
