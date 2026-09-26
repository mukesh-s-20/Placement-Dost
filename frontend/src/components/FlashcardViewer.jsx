import React, { useState } from 'react';
import { Layers, ChevronLeft, ChevronRight, RotateCw, CheckCircle2 } from 'lucide-react';

export const FlashcardViewer = ({ flashcards = [], moduleTitle, onCompleteModule }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState(new Set());

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="p-6 bg-white border border-slate-200 rounded text-center text-slate-500 text-xs">
        No flashcards loaded for this module.
      </div>
    );
  }

  const current = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const toggleMastered = (id) => {
    const updated = new Set(masteredCards);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setMasteredCards(updated);

    if (updated.size === flashcards.length && onCompleteModule) {
      onCompleteModule();
    }
  };

  return (
    <div className="flashcard-container">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <h4 className="text-xs font-bold text-slate-900">{moduleTitle || 'Placement Flashcard Deck'}</h4>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Card {currentIndex + 1} of {flashcards.length} • {masteredCards.size}/{flashcards.length} Mastered
        </div>
      </div>

      {/* The 3D Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="flashcard-card"
      >
        {!isFlipped ? (
          <div className="flashcard-face flashcard-front">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              Question (Click to Flip)
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {current.question}
            </p>
            <div className="mt-auto flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-3">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Click card to reveal answer</span>
            </div>
          </div>
        ) : (
          <div className="flashcard-face flashcard-back">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 block">
              Concept Answer
            </span>
            <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-mono">
              {current.answer}
            </div>
            <div className="mt-auto flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-3">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Click card to view question</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            className="btn-secondary text-xs flex items-center gap-1 py-1.5 px-3"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>
          <button
            onClick={handleNext}
            className="btn-secondary text-xs flex items-center gap-1 py-1.5 px-3"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => toggleMastered(current.id)}
          className={`text-xs font-semibold py-1.5 px-3 rounded flex items-center gap-1.5 transition-colors ${
            masteredCards.has(current.id)
              ? 'bg-slate-100 text-slate-900 border border-slate-300'
              : 'btn-secondary'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{masteredCards.has(current.id) ? 'Mastered ✓' : 'Mark as Mastered'}</span>
        </button>
      </div>

      {masteredCards.size === flashcards.length && (
        <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-700" />
            <span>All flashcards mastered. Module completed.</span>
          </div>
          <strong className="text-slate-900 font-bold">+1 pt</strong>
        </div>
      )}
    </div>
  );
};
