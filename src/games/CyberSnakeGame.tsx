import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState } from '../types/arcade';
import { soundService } from '../services/soundService';
import { Play, RotateCcw, Pause, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface CyberSnakeProps {
  bestScore: number;
  showTouchControls: boolean;
  onGameOver: (score: number, detail: string) => void;
}

interface GridPoint {
  x: number;
  y: number;
}

const COLS = 24;
const ROWS = 16;

export const CyberSnakeGame: React.FC<CyberSnakeProps> = ({
  bestScore,
  showTouchControls,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [snakeLength, setSnakeLength] = useState(4);
  const [speedLevel, setSpeedLevel] = useState(1);

  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const stateRef = useRef({
    status: 'TITLE_MENU' as GameState,
    snake: [
      { x: 10, y: 8 },
      { x: 9, y: 8 },
      { x: 8, y: 8 },
      { x: 7, y: 8 },
    ] as GridPoint[],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    orb: { x: 16, y: 8 } as GridPoint,
    bonusOrb: null as (GridPoint & { timer: number }) | null,
    score: 0,
    orbsCollected: 0,
    lastStepTime: 0,
  });

  const spawnFreeOrb = (snakeBody: GridPoint[]): GridPoint => {
    for (let attempt = 0; attempt < 200; attempt++) {
      const candidate = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
      if (!snakeBody.some((seg) => seg.x === candidate.x && seg.y === candidate.y)) {
        return candidate;
      }
    }
    return { x: 2, y: 2 };
  };

  const resetGame = useCallback(() => {
    const initialSnake = [
      { x: 10, y: 8 },
      { x: 9, y: 8 },
      { x: 8, y: 8 },
      { x: 7, y: 8 },
    ];
    stateRef.current = {
      status: 'PLAYING',
      snake: initialSnake,
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      orb: spawnFreeOrb(initialSnake),
      bonusOrb: null,
      score: 0,
      orbsCollected: 0,
      lastStepTime: performance.now(),
    };
    setScore(0);
    setSnakeLength(4);
    setSpeedLevel(1);
    setGameState('PLAYING');
    soundService.playButton();
  }, []);

  const changeDirection = useCallback((dx: number, dy: number) => {
    const s = stateRef.current;
    if (s.status !== 'PLAYING') return;
    // Prevent 180-degree self-reversal
    if (s.dir.x + dx === 0 && s.dir.y + dy === 0) return;
    s.nextDir = { x: dx, y: dy };
  }, []);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (s.status === 'PLAYING') {
      s.status = 'PAUSED';
      setGameState('PAUSED');
      soundService.playButton();
    } else if (s.status === 'PAUSED') {
      s.status = 'PLAYING';
      s.lastStepTime = performance.now();
      setGameState('PLAYING');
      soundService.playButton();
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
        if (stateRef.current.status === 'PLAYING') {
          e.preventDefault();
        }
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') changeDirection(0, -1);
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') changeDirection(0, 1);
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') changeDirection(-1, 0);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') changeDirection(1, 0);
      else if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
      else if (
        (stateRef.current.status === 'TITLE_MENU' || stateRef.current.status === 'GAME_OVER') &&
        e.code === 'Space'
      ) {
        e.preventDefault();
        resetGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [changeDirection, togglePause, resetGame]);

  useEffect(() => {
    let animId: number;

    const renderLoop = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const s = stateRef.current;
      const stepInterval = Math.max(62, 138 - s.orbsCollected * 3.5);

      if (s.status === 'PLAYING' && now - s.lastStepTime >= stepInterval) {
        s.lastStepTime = now;
        s.dir = { ...s.nextDir };

        const head = s.snake[0];
        const nextHead = {
          x: head.x + s.dir.x,
          y: head.y + s.dir.y,
        };

        // Check Wall or Self Collision
        const hitWall =
          nextHead.x < 0 || nextHead.x >= COLS || nextHead.y < 0 || nextHead.y >= ROWS;
        const hitSelf = s.snake
          .slice(0, -1)
          .some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);

        if (hitWall || hitSelf) {
          s.status = 'GAME_OVER';
          setGameState('GAME_OVER');
          soundService.playGameOver();
          onGameOver(s.score, `Length ${s.snake.length} · ${s.orbsCollected} orbs absorbed`);
        } else {
          const newSnake = [nextHead, ...s.snake];

          // Check primary orb pickup
          if (nextHead.x === s.orb.x && nextHead.y === s.orb.y) {
            s.orbsCollected += 1;
            s.score += 100 + s.orbsCollected * 10;
            s.orb = spawnFreeOrb(newSnake);
            soundService.playScore();

            // Spawn timed bonus orb every 4 pickups
            if (s.orbsCollected % 4 === 0 && !s.bonusOrb) {
              const bPos = spawnFreeOrb([...newSnake, s.orb]);
              s.bonusOrb = { ...bPos, timer: 42 };
            }
          } else if (
            s.bonusOrb &&
            nextHead.x === s.bonusOrb.x &&
            nextHead.y === s.bonusOrb.y
          ) {
            s.score += 250;
            s.bonusOrb = null;
            soundService.playScore();
          } else {
            newSnake.pop();
          }

          if (s.bonusOrb) {
            s.bonusOrb.timer -= 1;
            if (s.bonusOrb.timer <= 0) {
              s.bonusOrb = null;
            }
          }

          s.snake = newSnake;
          setScore(s.score);
          setSnakeLength(newSnake.length);
          setSpeedLevel(1 + Math.floor(s.orbsCollected / 3));
        }
      }

      // Draw Board
      const cellW = canvas.width / COLS;
      const cellH = canvas.height / ROWS;

      ctx.fillStyle = '#070B14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle Grid Lines
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.07)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellW, 0);
        ctx.lineTo(c * cellW, canvas.height);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellH);
        ctx.lineTo(canvas.width, r * cellH);
        ctx.stroke();
      }

      // Draw Energy Orb
      ctx.save();
      const ox = (s.orb.x + 0.5) * cellW;
      const oy = (s.orb.y + 0.5) * cellH;
      ctx.fillStyle = '#E879F9';
      ctx.beginPath();
      ctx.arc(ox, oy, Math.min(cellW, cellH) * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FAE8FF';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Draw Bonus Orb
      if (s.bonusOrb) {
        ctx.save();
        const bx = (s.bonusOrb.x + 0.5) * cellW;
        const by = (s.bonusOrb.y + 0.5) * cellH;
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(bx, by, Math.min(cellW, cellH) * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FEF3C7';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Cyber Snake Segments
      s.snake.forEach((seg, index) => {
        const isHead = index === 0;
        const pad = 2.5;
        ctx.fillStyle = isHead ? '#22D3EE' : '#0891B2';
        ctx.strokeStyle = isHead ? '#ECFEFF' : '#06B6D4';
        ctx.lineWidth = isHead ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(
          seg.x * cellW + pad,
          seg.y * cellH + pad,
          cellW - pad * 2,
          cellH - pad * 2,
          isHead ? 6 : 4
        );
        ctx.fill();
        ctx.stroke();
      });

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [onGameOver]);

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
          <div className="text-xs text-slate-400">Serpent Length & Tier</div>
          <div className="text-sm font-semibold text-purple-300 font-mono-tabular mt-1">
            {snakeLength} segments · Speed Tier {speedLevel}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {gameState === 'PLAYING' || gameState === 'PAUSED' ? (
            <button
              type="button"
              onClick={togglePause}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Pause className="w-3.5 h-3.5" />
              {gameState === 'PAUSED' ? 'Resume' : 'Pause'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={resetGame}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>
      </div>

      {/* Canvas Arena */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#070B14]">
        <canvas
          ref={canvasRef}
          width={768}
          height={512}
          onPointerDown={(e) => {
            swipeStartRef.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={(e) => {
            if (!swipeStartRef.current) return;
            const dx = e.clientX - swipeStartRef.current.x;
            const dy = e.clientY - swipeStartRef.current.y;
            if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
              if (Math.abs(dx) > Math.abs(dy)) {
                changeDirection(dx > 0 ? 1 : -1, 0);
              } else {
                changeDirection(0, dy > 0 ? 1 : -1);
              }
            }
            swipeStartRef.current = null;
          }}
          className="w-full h-[300px] sm:h-[380px] block touch-none"
        />

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Cyber Snake</h3>
            <p className="text-sm text-slate-300 max-w-md mb-5">
              Guide the neon serpent across the grid to absorb magenta energy orbs and golden overdrive nodes without hitting the perimeter or your own tail.
            </p>
            <button
              type="button"
              onClick={resetGame}
              className="px-6 py-3 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-sm hover:bg-cyan-300 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Game Paused</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePause}
                className="px-5 py-2.5 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-sm hover:bg-cyan-300 transition-colors"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={resetGame}
                className="px-5 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 font-semibold text-sm hover:bg-slate-700 transition-colors"
              >
                Restart
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="text-xs font-medium text-rose-400 mb-1">Circuit Interrupted</div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Serpent Terminated</h3>
            <p className="text-sm text-slate-300 font-mono-tabular mb-5">
              Final Score: <span className="text-cyan-400 font-bold">{score.toLocaleString()} pts</span> · Length: {snakeLength}
            </p>
            <button
              type="button"
              onClick={resetGame}
              className="px-6 py-3 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-sm hover:bg-cyan-300 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Directional Touch Controls */}
      {showTouchControls && (
        <div className="grid grid-cols-4 gap-2.5">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              changeDirection(-1, 0);
            }}
            className="py-3 rounded-xl bg-[#0E1525] border border-slate-800 active:border-cyan-400 text-slate-200 flex items-center justify-center gap-1.5 text-xs font-semibold select-none"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" /> Left
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              changeDirection(0, -1);
            }}
            className="py-3 rounded-xl bg-[#0E1525] border border-slate-800 active:border-cyan-400 text-slate-200 flex items-center justify-center gap-1.5 text-xs font-semibold select-none"
          >
            <ArrowUp className="w-4 h-4 text-cyan-400" /> Up
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              changeDirection(0, 1);
            }}
            className="py-3 rounded-xl bg-[#0E1525] border border-slate-800 active:border-cyan-400 text-slate-200 flex items-center justify-center gap-1.5 text-xs font-semibold select-none"
          >
            <ArrowDown className="w-4 h-4 text-cyan-400" /> Down
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              changeDirection(1, 0);
            }}
            className="py-3 rounded-xl bg-[#0E1525] border border-slate-800 active:border-cyan-400 text-slate-200 flex items-center justify-center gap-1.5 text-xs font-semibold select-none"
          >
            <ArrowRight className="w-4 h-4 text-cyan-400" /> Right
          </button>
        </div>
      )}
    </div>
  );
};
