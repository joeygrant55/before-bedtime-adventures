"use client";

interface Spread {
  spreadIndex: number;
  leftPageId: string;
  rightPageId?: string;
  thumbnailUrl?: string;
}

interface SpreadNavigatorProps {
  spreads: Spread[];
  currentSpreadIndex: number;
  onSpreadChange: (index: number) => void;
  onAddSpread: () => void;
  onDeleteSpread: (index: number) => void;
}

export function SpreadNavigator({
  spreads,
  currentSpreadIndex,
  onSpreadChange,
  onAddSpread,
  onDeleteSpread,
}: SpreadNavigatorProps) {
  return (
    <div className="bg-white border-t border-gray-200 shadow-lg p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSpreadChange(Math.max(0, currentSpreadIndex - 1))}
              disabled={currentSpreadIndex === 0}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Previous spread"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <span className="text-sm font-medium text-gray-700">
              Spread {currentSpreadIndex + 1} of {spreads.length}
            </span>

            <button
              onClick={() => onSpreadChange(Math.min(spreads.length - 1, currentSpreadIndex + 1))}
              disabled={currentSpreadIndex === spreads.length - 1}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Next spread"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={onAddSpread}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md transition-all"
          >
            <span>+</span>
            <span>Add Spread</span>
          </button>
        </div>

        {/* Filmstrip */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {spreads.map((spread, index) => (
            <div key={spread.spreadIndex} className="relative flex-shrink-0">
              <button
                onClick={() => onSpreadChange(index)}
                className={`w-24 h-16 rounded-lg border-2 transition-all ${
                  index === currentSpreadIndex
                    ? "border-purple-600 ring-4 ring-purple-600/20 scale-105"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                {spread.thumbnailUrl ? (
                  <img
                    src={spread.thumbnailUrl}
                    alt={`Spread ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                    Spread {index + 1}
                  </div>
                )}
              </button>
              
              {/* Delete button */}
              {spreads.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this spread?")) {
                      onDeleteSpread(index);
                    }
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="Delete spread"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Spread number */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-medium whitespace-nowrap">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
