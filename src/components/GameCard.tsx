import React, { useState } from 'react';
import { GameMetadata } from '../types/arcade';
import { Play, Gamepad2 } from 'lucide-react';

interface GameCardProps {
  game: GameMetadata;
  bestScore: number;
  playCount: number;
  onPlay: (game: GameMetadata) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  bestScore,
  playCount,
  onPlay,
}) => {
  const [imgError, setImgError] = useState(false);

  const formattedBest =
    bestScore > 0 ? `${bestScore.toLocaleString()} ${game.scoreUnit}` : 'No Record';

  return (
    <article className="group bg-[#0E1525] border border-slate-800/90 hover:border-cyan-500/50 rounded-xl overflow-hidden flex flex-col transition-all duration-150 hover:-translate-y-0.5">
      {/* 4:3 Media Container with Zero-Broken-Image Fallback */}
      <div
        onClick={() => onPlay(game)}
        className="relative aspect-4/3 w-full overflow-hidden bg-[#090D16] cursor-pointer"
      >
        {!imgError ? (
          <img
            src={game.image}
            alt={`${game.title} — ${game.subtitle}`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#0E1525] to-slate-950 p-6 text-center">
            <Gamepad2 className="w-10 h-10 text-cyan-400 mb-2" />
            <span className="text-sm font-semibold text-slate-200">{game.title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E1525] via-black/25 to-transparent" />
      </div>

      {/* Content Zone */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          {/* Clean Unboxed Metadata with Typographic Separators (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 font-mono-tabular mb-1.5">
            <span className="text-cyan-400 font-medium">{game.category}</span>
            <span aria-hidden="true">·</span>
            <span>{game.difficulty}</span>
            <span aria-hidden="true">·</span>
            <span>Best: {formattedBest}</span>
            {playCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{playCount} {playCount === 1 ? 'play' : 'plays'}</span>
              </>
            )}
          </div>

          <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
            {game.title}
          </h3>
          <p className="text-xs text-slate-400 mb-2">{game.subtitle}</p>
          <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
            {game.description}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 truncate">
            {game.desktopControls.split('·')[0].trim()}
          </div>
          <button
            type="button"
            onClick={() => onPlay(game)}
            className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-xs hover:bg-cyan-300 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Play Game
          </button>
        </div>
      </div>
    </article>
  );
};
