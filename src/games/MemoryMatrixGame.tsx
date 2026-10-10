import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundService } from '../services/soundService';
import { Play, RotateCcw, Grid } from 'lucide-react';

interface MemoryMatrixProps {
  bestScore: number;
  onGameOver: (score: number, detail: string) => void;
}

type MatrixState = 'IDLE' | 'SHOWING_SEQUENCE' | 'PLAYER_INPUT' | 'LEVEL_CLEAR' | 'GAME_OVER';

const GRID_SIZE = 16; // 4x4 grid

export const MemoryMatrixGame: React.FC<MemoryMatrixProps> = ({ bestScore, onGameOver }) => {
  const [matrixState, setMatrixState] = useState<MatrixState>('IDLE');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [highlightedTile, setHighlightedTile] = useState<number | null>(null);
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const [focusedTile, setFocusedTile] = useState<number>(0);

  const timeoutsRef = useRef<number[]>([]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  const playSequence = useCallback((seq: number[], currentLvl: number) => {
    clearAllTimeouts();
    setMatrixState('SHOWING_SEQUENCE');
    setHighlightedTile(null);
    setWrongTile(null);
    setPlayerStep(0);

    const stepDuration = Math.max(280, 560 - currentLvl * 22);
    const gapDuration = 140;

    seq.forEach((tileIdx, i) => {
      const showTime = 450 + i * (stepDuration + gapDuration);
      const hideTime = showTime + stepDuration;

      const t1 = window.setTimeout(() => {
        setHighlightedTile(tileIdx);
        soundService.playSequenceTone(tileIdx);
      }, showTime);

      const t2 = window.setTimeout(() => {
        setHighlightedTile(null);
      }, hideTime);

      timeoutsRef.current.push(t1, t2);
    });

    const unlockTime = 480 + seq.length * (stepDuration + gapDuration);
    const tUnlock = window.setTimeout(() => {
      setHighlightedTile(null);
      setMatrixState('PLAYER_INPUT');
    }, unlockTime);
    timeoutsRef.current.push(tUnlock);
  }, []);

  const startNewGame = useCallback(() => {
    soundService.playButton();
    clearAllTimeouts();
    const initialSeq: number[] = [];
    for (let i = 0; i < 3; i++) {
      initialSeq.push(Math.floor(Math.random() * GRID_SIZE));
    }
    setLevel(1);
    setScore(0);
    setSequence(initialSeq);
    playSequence(initialSeq, 1);
  }, [playSequence]);

  const handleTileSelect = useCallback(
    (tileIdx: number) => {
      if (matrixState !== 'PLAYER_INPUT') return;

      setFocusedTile(tileIdx);
      const expectedTile = sequence[playerStep];

      if (tileIdx === expectedTile) {
        soundService.playSequenceTone(tileIdx);
        setHighlightedTile(tileIdx);
        const t = window.setTimeout(() => setHighlightedTile(null), 190);
        timeoutsRef.current.push(t);

        const nextStep = playerStep + 1;
        const nextScore = score + 25 + level * 10;
        setScore(nextScore);

        if (nextStep >= sequence.length) {
          // Completed full sequence
          const completedBonus = nextScore + level * 50;
          setScore(completedBonus);
          setMatrixState('LEVEL_CLEAR');
          soundService.playScore();

          const nextLevel = level + 1;
          const nextSeq = [...sequence, Math.floor(Math.random() * GRID_SIZE)];
          const tNext = window.setTimeout(() => {
            setLevel(nextLevel);
            setSequence(nextSeq);
            playSequence(nextSeq, nextLevel);
          }, 800);
          timeoutsRef.current.push(tNext);
        } else {
          setPlayerStep(nextStep);
        }
      } else {
        // Incorrect sequence input
        setWrongTile(tileIdx);
        setHighlightedTile(expectedTile);
        setMatrixState('GAME_OVER');
        soundService.playGameOver();
        onGameOver(score, `Level ${level} reached · ${sequence.length} sequence nodes`);
      }
    },
    [matrixState, sequence, playerStep, score, level, playSequence, onGameOver]
  );

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matrixState !== 'PLAYER_INPUT') {
        if ((matrixState === 'IDLE' || matrixState === 'GAME_OVER') && e.code === 'Space') {
          e.preventDefault();
          startNewGame();
        }
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
      }

      const row = Math.floor(focusedTile / 4);
      const col = focusedTile % 4;

      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        setFocusedTile(((row + 3) % 4) * 4 + col);
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        setFocusedTile(((row + 1) % 4) * 4 + col);
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        setFocusedTile(row * 4 + ((col + 3) % 4));
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        setFocusedTile(row * 4 + ((col + 1) % 4));
      } else if (e.code === 'Space' || e.code === 'Enter') {
        handleTileSelect(focusedTile);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matrixState, focusedTile, handleTileSelect, startNewGame]);

  return (
    <div className="flex flex-col gap-4">
      {/* Top HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0E1525] border border-slate-800 rounded-xl p-3.5">
        <div>
          <div className="text-xs text-slate-400">Current Score</div>
          <div className="text-xl font-bold text-cyan-400 font-mono-tabular">{score.toLocaleString()} pts</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Personal Best</div>
          <div className="text-xl font-bold text-slate-100 font-mono-tabular">
            {Math.max(score, bestScore).toLocaleString()} pts
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Matrix Level & Sequence</div>
          <div className="text-sm font-semibold text-purple-300 font-mono-tabular mt-1">
            Level {level} · {sequence.length > 0 ? `${playerStep}/${sequence.length} nodes` : '3 nodes'}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-xs font-medium text-slate-300">
            {matrixState === 'SHOWING_SEQUENCE'
              ? 'Watch Sequence...'
              : matrixState === 'PLAYER_INPUT'
              ? 'Your Turn'
              : matrixState === 'LEVEL_CLEAR'
              ? 'Sequence Verified!'
              : 'Ready'}
          </span>
          <button
            type="button"
            onClick={startNewGame}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>
      </div>

      {/* Main Matrix Arena */}
      <div className="relative rounded-xl border border-slate-800 bg-[#070B14] p-6 sm:p-8 flex flex-col items-center justify-center min-h-[360px]">
        <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full max-w-[360px] aspect-square">
          {Array.from({ length: GRID_SIZE }).map((_, idx) => {
            const isHighlighted = highlightedTile === idx;
            const isWrong = wrongTile === idx;
            const isKeyboardFocused = matrixState === 'PLAYER_INPUT' && focusedTile === idx;

            return (
              <button
                key={idx}
                type="button"
                disabled={matrixState !== 'PLAYER_INPUT'}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleTileSelect(idx);
                }}
                className={`rounded-xl border transition-all duration-150 flex items-center justify-center font-mono-tabular text-xs font-semibold select-none ${
                  isWrong
                    ? 'bg-rose-500/40 border-rose-400 text-white shadow-[0_0_25px_rgba(244,63,94,0.45)] scale-95'
                    : isHighlighted
                    ? 'bg-cyan-400 border-cyan-200 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.65)] scale-[1.03]'
                    : isKeyboardFocused
                    ? 'bg-slate-800/90 border-purple-400/70 text-slate-300'
                    : 'bg-[#0E1628] border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Start Overlay */}
        {matrixState === 'IDLE' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-6 text-center">
            <Grid className="w-10 h-10 text-purple-400 mb-3" />
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Memory Matrix</h3>
            <p className="text-sm text-slate-300 max-w-md mb-5">
              Memorize the sequence of illuminated tiles on the 4x4 neural grid, then repeat the exact order. Each level adds a new node to the pattern.
            </p>
            <button
              type="button"
              onClick={startNewGame}
              className="px-6 py-3 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-sm hover:bg-cyan-300 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {matrixState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-6 text-center">
            <div className="text-xs font-medium text-rose-400 mb-1">Sequence Mismatch</div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Matrix Locked</h3>
            <p className="text-sm text-slate-300 font-mono-tabular mb-5">
              Final Score: <span className="text-cyan-400 font-bold">{score.toLocaleString()} pts</span> · Reached Level {level} ({sequence.length} nodes)
            </p>
            <button
              type="button"
              onClick={startNewGame}
              className="px-6 py-3 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-sm hover:bg-cyan-300 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
