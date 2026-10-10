import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState } from '../types/arcade';
import { soundService } from '../services/soundService';
import { Play, RotateCcw, Pause, ArrowUp, ArrowDown } from 'lucide-react';

interface CyberRunnerProps {
  bestScore: number;
  showTouchControls: boolean;
  onGameOver: (score: number, detail: string) => void;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'LOW_LASER' | 'TALL_PYLON' | 'AERIAL_DRONE';
  passed: boolean;
}

interface DataShard {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export const CyberRunnerGame: React.FC<CyberRunnerProps> = ({
  bestScore,
  showTouchControls,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [dodgedCount, setDodgedCount] = useState(0);

  const stateRef = useRef({
    status: 'TITLE_MENU' as GameState,
    playerY: 280,
    playerVy: 0,
    jumpsRemaining: 2,
    isSliding: false,
    slideTimer: 0,
    speed: 6.2,
    distance: 0,
    bonusPoints: 0,
    dodges: 0,
    spawnTimer: 0,
    shardTimer: 0,
    gridOffset: 0,
    obstacles: [] as Obstacle[],
    shards: [] as DataShard[],
    particles: [] as Particle[],
  });

  const GROUND_Y = 320;
  const PLAYER_X = 110;
  const NORMAL_H = 54;
  const SLIDE_H = 28;
  const PLAYER_W = 34;

  const spawnBurst = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 4.5;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 1.0,
        color,
      });
    }
  };

  const resetGame = useCallback(() => {
    stateRef.current = {
      status: 'PLAYING',
      playerY: GROUND_Y - NORMAL_H,
      playerVy: 0,
      jumpsRemaining: 2,
      isSliding: false,
      slideTimer: 0,
      speed: 6.2,
      distance: 0,
      bonusPoints: 0,
      dodges: 0,
      spawnTimer: 45,
      shardTimer: 70,
      gridOffset: 0,
      obstacles: [],
      shards: [],
      particles: [],
    };
    setScore(0);
    setDistanceMeters(0);
    setSpeedMultiplier(1.0);
    setDodgedCount(0);
    setGameState('PLAYING');
    soundService.playButton();
  }, []);

  const triggerJump = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== 'PLAYING') return;
    if (s.jumpsRemaining > 0) {
      s.isSliding = false;
      s.slideTimer = 0;
      s.playerVy = s.jumpsRemaining === 2 ? -13.2 : -11.4;
      s.jumpsRemaining -= 1;
      soundService.playJump();
      spawnBurst(PLAYER_X + PLAYER_W / 2, s.playerY + NORMAL_H, '#22D3EE', 8);
    }
  }, []);

  const triggerSlide = useCallback(() => {
    const s = stateRef.current;
    if (s.status !== 'PLAYING') return;
    s.isSliding = true;
    s.slideTimer = 34; // frames
    // If airborne, fast-drop to ground
    if (s.playerY < GROUND_Y - NORMAL_H) {
      s.playerVy = Math.max(s.playerVy, 12);
    }
    soundService.playSlide();
  }, []);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (s.status === 'PLAYING') {
      s.status = 'PAUSED';
      setGameState('PAUSED');
      soundService.playButton();
    } else if (s.status === 'PAUSED') {
      s.status = 'PLAYING';
      setGameState('PLAYING');
      soundService.playButton();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
        if (stateRef.current.status === 'PLAYING') {
          e.preventDefault();
        }
      }
      if (stateRef.current.status === 'PLAYING') {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          triggerJump();
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          triggerSlide();
        } else if (e.code === 'KeyP' || e.code === 'Escape') {
          togglePause();
        }
      } else if (stateRef.current.status === 'PAUSED' && (e.code === 'KeyP' || e.code === 'Escape')) {
        togglePause();
      } else if (
        (stateRef.current.status === 'TITLE_MENU' || stateRef.current.status === 'GAME_OVER') &&
        e.code === 'Space'
      ) {
        e.preventDefault();
        resetGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerJump, triggerSlide, togglePause, resetGame]);

  useEffect(() => {
    let animationFrameId: number;

    const updateAndDraw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const s = stateRef.current;

      if (s.status === 'PLAYING') {
        // Gradually increase speed
        s.speed = Math.min(14.5, 6.2 + s.distance * 0.0014);
        s.distance += s.speed * 0.16;
        s.gridOffset = (s.gridOffset + s.speed) % 48;

        // Slide timer
        if (s.isSliding) {
          s.slideTimer -= 1;
          if (s.slideTimer <= 0) {
            s.isSliding = false;
          }
        }

        const currentHeight = s.isSliding ? SLIDE_H : NORMAL_H;
        const targetGroundY = GROUND_Y - currentHeight;

        // Apply gravity
        s.playerY += s.playerVy;
        s.playerVy += 0.68;

        if (s.playerY >= targetGroundY) {
          s.playerY = targetGroundY;
          s.playerVy = 0;
          s.jumpsRemaining = 2;
        }

        // Spawn obstacles
        s.spawnTimer -= 1;
        if (s.spawnTimer <= 0) {
          const roll = Math.random();
          let obs: Obstacle;
          if (roll < 0.44) {
            obs = {
              x: canvas.width + 40,
              y: GROUND_Y - 42,
              width: 28,
              height: 42,
              type: 'LOW_LASER',
              passed: false,
            };
          } else if (roll < 0.74) {
            obs = {
              x: canvas.width + 40,
              y: GROUND_Y - 68,
              width: 34,
              height: 68,
              type: 'TALL_PYLON',
              passed: false,
            };
          } else {
            // Aerial drone that requires sliding under OR high jump over
            obs = {
              x: canvas.width + 40,
              y: GROUND_Y - 76,
              width: 46,
              height: 34,
              type: 'AERIAL_DRONE',
              passed: false,
            };
          }
          s.obstacles.push(obs);
          const minGap = Math.max(38, Math.floor(88 - s.speed * 3.2));
          s.spawnTimer = minGap + Math.floor(Math.random() * 38);
        }

        // Spawn collectible data shards
        s.shardTimer -= 1;
        if (s.shardTimer <= 0) {
          const heights = [GROUND_Y - 35, GROUND_Y - 95, GROUND_Y - 135];
          const chosenY = heights[Math.floor(Math.random() * heights.length)];
          s.shards.push({
            x: canvas.width + 30,
            y: chosenY,
            radius: 10,
            collected: false,
          });
          s.shardTimer = 65 + Math.floor(Math.random() * 55);
        }

        // Update shards
        for (let i = s.shards.length - 1; i >= 0; i--) {
          const shard = s.shards[i];
          shard.x -= s.speed;
          const pTop = s.isSliding ? GROUND_Y - SLIDE_H : s.playerY;
          const pBottom = pTop + (s.isSliding ? SLIDE_H : NORMAL_H);
          const cx = Math.max(PLAYER_X, Math.min(shard.x, PLAYER_X + PLAYER_W));
          const cy = Math.max(pTop, Math.min(shard.y, pBottom));
          const dx = shard.x - cx;
          const dy = shard.y - cy;
          if (!shard.collected && dx * dx + dy * dy <= shard.radius * shard.radius) {
            shard.collected = true;
            s.bonusPoints += 50;
            soundService.playScore();
            spawnBurst(shard.x, shard.y, '#22D3EE', 10);
          }
          if (shard.x < -30 || shard.collected) {
            s.shards.splice(i, 1);
          }
        }

        // Update obstacles & collision
        const pLeft = PLAYER_X + 4;
        const pRight = PLAYER_X + PLAYER_W - 4;
        const pTop = (s.isSliding ? GROUND_Y - SLIDE_H : s.playerY) + 4;
        const pBottom = pTop + (s.isSliding ? SLIDE_H : NORMAL_H) - 8;

        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          if (!obs.passed && obs.x + obs.width < PLAYER_X) {
            obs.passed = true;
            s.dodges += 1;
            s.bonusPoints += 25;
            setDodgedCount(s.dodges);
          }

          // AABB Collision check
          if (
            pRight > obs.x + 3 &&
            pLeft < obs.x + obs.width - 3 &&
            pBottom > obs.y + 3 &&
            pTop < obs.y + obs.height - 3
          ) {
            s.status = 'GAME_OVER';
            setGameState('GAME_OVER');
            soundService.playExplosion();
            soundService.playGameOver();
            spawnBurst(PLAYER_X + PLAYER_W / 2, pTop + 16, '#F43F5E', 24);
            const finalScore = Math.floor(s.distance) + s.bonusPoints;
            setScore(finalScore);
            onGameOver(finalScore, `${Math.floor(s.distance)}m sprinted · ${s.dodges} dodges`);
            break;
          }

          if (obs.x + obs.width < -40) {
            s.obstacles.splice(i, 1);
          }
        }

        // Update HUD state periodically
        const totalScore = Math.floor(s.distance) + s.bonusPoints;
        setScore(totalScore);
        setDistanceMeters(Math.floor(s.distance));
        setSpeedMultiplier(Number((s.speed / 6.2).toFixed(1)));
      }

      // Update particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.035;
        if (pt.life <= 0) {
          s.particles.splice(i, 1);
        }
      }

      // RENDER ARENA
      ctx.fillStyle = '#070B14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant skyline silhouettes
      ctx.fillStyle = '#0D1526';
      for (let i = 0; i < 12; i++) {
        const bx = ((i * 95 - s.gridOffset * 0.25) % (canvas.width + 95)) - 45;
        const bh = 70 + ((i * 37) % 90);
        ctx.fillRect(bx, GROUND_Y - bh, 62, bh);
      }

      // Perspective highway grid below GROUND_Y
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(canvas.width, GROUND_Y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(168, 85, 247, 0.16)';
      ctx.lineWidth = 1;
      for (let x = -s.gridOffset; x < canvas.width; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x - 36, canvas.height);
        ctx.stroke();
      }
      for (let y = GROUND_Y + 18; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw collectible shards
      s.shards.forEach((sh) => {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.fillStyle = '#22D3EE';
        ctx.beginPath();
        ctx.moveTo(0, -sh.radius);
        ctx.lineTo(sh.radius, 0);
        ctx.lineTo(0, sh.radius);
        ctx.lineTo(-sh.radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#E0F2FE';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      // Draw obstacles
      s.obstacles.forEach((obs) => {
        ctx.save();
        if (obs.type === 'AERIAL_DRONE') {
          ctx.fillStyle = '#A855F7';
          ctx.strokeStyle = '#F0ABFC';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
          ctx.fill();
          ctx.stroke();
          // Drone eye core
          ctx.fillStyle = '#22D3EE';
          ctx.fillRect(obs.x + 8, obs.y + 12, 12, 8);
        } else if (obs.type === 'TALL_PYLON') {
          ctx.fillStyle = '#E11D48';
          ctx.strokeStyle = '#FDA4AF';
          ctx.lineWidth = 2;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        } else {
          ctx.fillStyle = '#F43F5E';
          ctx.strokeStyle = '#FECDD3';
          ctx.lineWidth = 2;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        }
        ctx.restore();
      });

      // Draw Player Cyber Sprinter
      const drawH = s.isSliding ? SLIDE_H : NORMAL_H;
      const drawY = s.isSliding ? GROUND_Y - SLIDE_H : s.playerY;

      ctx.save();
      ctx.fillStyle = '#06B6D4';
      ctx.strokeStyle = '#CFFAFE';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(PLAYER_X, drawY, PLAYER_W, drawH, 6);
      ctx.fill();
      ctx.stroke();

      // Visor glow
      ctx.fillStyle = '#F472B6';
      ctx.fillRect(PLAYER_X + PLAYER_W - 12, drawY + 7, 9, 6);
      ctx.restore();

      // Draw particles
      s.particles.forEach((pt) => {
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, 4, 4);
      });
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(updateAndDraw);
    };

    animationFrameId = requestAnimationFrame(updateAndDraw);
    return () => cancelAnimationFrame(animationFrameId);
  }, [onGameOver]);

  return (
    <div className="flex flex-col gap-4">
      {/* Unobtrusive Top HUD Bar */}
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
          <div className="text-xs text-slate-400">Distance & Dodges</div>
          <div className="text-sm font-semibold text-slate-200 font-mono-tabular mt-1">
            {distanceMeters}m · {dodgedCount} dodged
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="text-xs text-slate-400 mr-2">
            Speed <span className="text-purple-300 font-mono-tabular font-semibold">{speedMultiplier}x</span>
          </div>
          {gameState === 'PLAYING' || gameState === 'PAUSED' ? (
            <button
              type="button"
              onClick={togglePause}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
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
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#070B14] shadow-lg">
        <canvas
          ref={canvasRef}
          width={860}
          height={380}
          onClick={() => {
            if (gameState === 'PLAYING') triggerJump();
          }}
          className="w-full h-[280px] sm:h-[360px] block cursor-pointer touch-none"
        />

        {/* Overlay States */}
        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Cyber Runner</h3>
            <p className="text-sm text-slate-300 max-w-md mb-5">
              Vault over ground laser barriers, double-jump across tall pylons, and slide underneath aerial patrol drones.
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
            <h3 className="text-2xl font-bold text-white mb-2">Game Paused</h3>
            <p className="text-sm text-slate-400 mb-5">Sector highway sprint on hold.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePause}
                className="px-5 py-2.5 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-sm hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0"
              >
                Resume Game
              </button>
              <button
                type="button"
                onClick={resetGame}
                className="px-5 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 font-semibold text-sm hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
              >
                Restart
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <div className="text-xs font-medium text-rose-400 mb-1">Collision Detected</div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Run Complete</h3>
            <p className="text-sm text-slate-300 mb-4 font-mono-tabular">
              Final Score: <span className="text-cyan-400 font-bold">{score.toLocaleString()} pts</span> · Distance: {distanceMeters}m
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

      {/* Responsive Touch Controls */}
      {showTouchControls && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              triggerJump();
            }}
            className="py-3.5 px-4 rounded-xl bg-[#0E1525] border border-cyan-500/30 active:bg-cyan-500/20 text-cyan-300 font-semibold text-sm flex items-center justify-center gap-2 select-none"
          >
            <ArrowUp className="w-4 h-4" />
            Jump / Double-Jump (Space / Up)
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              triggerSlide();
            }}
            className="py-3.5 px-4 rounded-xl bg-[#0E1525] border border-purple-500/30 active:bg-purple-500/20 text-purple-300 font-semibold text-sm flex items-center justify-center gap-2 select-none"
          >
            <ArrowDown className="w-4 h-4" />
            Slide / Duck (Down Arrow)
          </button>
        </div>
      )}
    </div>
  );
};
