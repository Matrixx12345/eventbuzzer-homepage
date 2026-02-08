/**
 * Magic Trip Selector Choice Modal
 * Allows user to choose between Blitz-Plan and Entdecker-Modus
 */

import { Sparkles, Zap, Target, X } from "lucide-react";

interface MagicTripSelectorChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlitzPlan: () => void;
  onSelectEntdeckerModus: () => void;
}

export default function MagicTripSelectorChoiceModal({
  isOpen,
  onClose,
  onSelectBlitzPlan,
  onSelectEntdeckerModus,
}: MagicTripSelectorChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <Sparkles className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Magic Trip Selector
          </h2>
          <p className="text-gray-600">
            Wie möchtest du deinen Tag planen?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Blitz-Plan Option */}
          <button
            onClick={onSelectBlitzPlan}
            className="w-full p-6 bg-gradient-to-br from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-2 border-yellow-200 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  ⚡ Blitz-Plan
                </h3>
                <p className="text-sm text-gray-700">
                  3 Events sofort vorschlagen
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  (Morgen, Mittag, Abend)
                </p>
              </div>
            </div>
          </button>

          {/* Entdecker-Modus Option */}
          <button
            onClick={onSelectEntdeckerModus}
            className="w-full p-6 bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-2 border-blue-200 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  🎯 Entdecker-Modus
                </h3>
                <p className="text-sm text-gray-700">
                  Events durchswipen & auswählen
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  (Interaktive Auswahl)
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
