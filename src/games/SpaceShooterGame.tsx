import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState } from '../types/arcade';
import { soundService } from '../services/soundService';
import { Play, RotateCcw, Pause, Crosshair, Shield, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface SpaceShooterProps {
  bestScore: number;
  showTouchControls: boolean;
  onGameOver: (score: number, detail: string) => void;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy: boolean;
}

interface Enemy {
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  type: 'SCOUT' | 'INTERCEPTOR' | 'CRUISER';
  phase: number;
  shootCooldown: number;
}

interface PowerUp {
  x: number;
  y: number;
  kind: 'WEAPON' | 'SHIELD';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export const SpaceShooterGame: React.FC<SpaceShooterProps> = ({
  bestScore,
  showTouchControls,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [shields, setShields] = useState(3);
  const [wave, setWave] = useState(1);
  const [autoFire, setAutoFire] = useState(true);

  const keysRef = useRef<Record<string, boolean>>({});
  const touchDirRef = useRef<{ dx: number; dy: number; firing: boolean }>({
    dx: 0,
    dy: 0,
    firing: false,
  });

  const stateRef = useRef({
    status: 'TITLE_MENU' as GameState,
    shipX: 430,
    shipY: 320,
    shields: 3,
    weaponTier: 1,
    weaponTimer: 0,
    score: 0,
    kills: 0,
    wave: 1,
    fireCooldown: 0,
    spawnTimer: 30,
    invulnTimer: 0,
    autoFire: true,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    stars: Array.from({ length: 55 }, () => ({
      x: Math.random() * 860,
      y: Math.random() * 380,
      speed: 0.6 + Math.random() * 2.2,
      size: Math.random() > 0.7 ? 2 : 1,
    })),
  });

  const spawnExplosion = (x: number, y: number, color: string, count = 14) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1 + Math.random() * 4.5;
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
      ...stateRef.current,
      status: 'PLAYING',
      shipX: 430,
      shipY: 320,
      shields: 3,
      weaponTier: 1,
      weaponTimer: 0,
      score: 0,
      kills: 0,
      wave: 1,
      fireCooldown: 0,
      spawnTimer: 25,
      invulnTimer: 0,
      bullets: [],
      enemies: [],
      powerUps: [],
      particles: [],
    };
    setScore(0);
    setShields(3);
    setWave(1);
    setGameState('PLAYING');
    soundService.playButton();
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

  const toggleAutoFire = () => {
    const next = !autoFire;
    setAutoFire(next);
    stateRef.current.autoFire = next;
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(
          e.code
        )
      ) {
        if (stateRef.current.status === 'PLAYING') {
          e.preventDefault();
        }
      }
      keysRef.current[e.code] = true;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        togglePause();
      } else if (
        (stateRef.current.status === 'TITLE_MENU' || stateRef.current.status === 'GAME_OVER') &&
        e.code === 'Space'
      ) {
        e.preventDefault();
        resetGame();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [togglePause, resetGame]);

  useEffect(() => {
    let animId: number;

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const s = stateRef.current;

      if (s.status === 'PLAYING') {
        // Starfield update
        s.stars.forEach((st) => {
          st.y += st.speed + s.wave * 0.15;
          if (st.y > canvas.height) {
            st.y = 0;
            st.x = Math.random() * canvas.width;
          }
        });

        // Player movement
        let dx = touchDirRef.current.dx;
        let dy = touchDirRef.current.dy;
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) dx -= 1;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) dx += 1;
        if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) dy -= 1;
        if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) dy += 1;

        const moveSpeed = 5.6;
        s.shipX = Math.max(26, Math.min(canvas.width - 26, s.shipX + dx * moveSpeed));
        s.shipY = Math.max(40, Math.min(canvas.height - 28, s.shipY + dy * moveSpeed));

        if (s.invulnTimer > 0) s.invulnTimer -= 1;
        if (s.weaponTimer > 0) {
          s.weaponTimer -= 1;
          if (s.weaponTimer <= 0) s.weaponTier = 1;
        }

        // Player shooting
        if (s.fireCooldown > 0) s.fireCooldown -= 1;
        const wantsToShoot =
          s.autoFire || keysRef.current['Space'] || touchDirRef.current.firing;

        if (wantsToShoot && s.fireCooldown <= 0) {
          if (s.weaponTier >= 2) {
            s.bullets.push(
              { x: s.shipX - 11, y: s.shipY - 16, vx: -0.4, vy: -10.5, isEnemy: false },
              { x: s.shipX, y: s.shipY - 20, vx: 0, vy: -11, isEnemy: false },
              { x: s.shipX + 11, y: s.shipY - 16, vx: 0.4, vy: -10.5, isEnemy: false }
            );
          } else {
            s.bullets.push(
              { x: s.shipX - 8, y: s.shipY - 16, vx: 0, vy: -10.5, isEnemy: false },
              { x: s.shipX + 8, y: s.shipY - 16, vx: 0, vy: -10.5, isEnemy: false }
            );
          }
          soundService.playShoot();
          s.fireCooldown = 12;
        }

        // Wave calculation
        const currentWave = 1 + Math.floor(s.score / 750);
        if (currentWave !== s.wave) {
          s.wave = currentWave;
          setWave(currentWave);
        }

        // Spawn Enemies
        s.spawnTimer -= 1;
        if (s.spawnTimer <= 0) {
          const r = Math.random();
          const ex = 40 + Math.random() * (canvas.width - 80);
          if (r < 0.52) {
            s.enemies.push({
              x: ex,
              y: -24,
              radius: 15,
              hp: 2,
              maxHp: 2,
              speed: 1.9 + s.wave * 0.2,
              type: 'SCOUT',
              phase: Math.random() * Math.PI * 2,
              shootCooldown: 90,
            });
          } else if (r < 0.84) {
            s.enemies.push({
              x: ex,
              y: -26,
              radius: 17,
              hp: 3,
              maxHp: 3,
              speed: 1.5 + s.wave * 0.16,
              type: 'INTERCEPTOR',
              phase: Math.random() * Math.PI * 2,
              shootCooldown: 65,
            });
          } else {
            s.enemies.push({
              x: ex,
              y: -32,
              radius: 23,
              hp: 7 + s.wave,
              maxHp: 7 + s.wave,
              speed: 1.0 + s.wave * 0.1,
              type: 'CRUISER',
              phase: 0,
              shootCooldown: 55,
            });
          }
          s.spawnTimer = Math.max(20, 56 - s.wave * 4);
        }

        // Update Bullets
        for (let i = s.bullets.length - 1; i >= 0; i--) {
          const b = s.bullets[i];
          b.x += b.vx;
          b.y += b.vy;

          if (b.y < -20 || b.y > canvas.height + 20 || b.x < -20 || b.x > canvas.width + 20) {
            s.bullets.splice(i, 1);
            continue;
          }

          if (b.isEnemy) {
            const dxShip = b.x - s.shipX;
            const dyShip = b.y - s.shipY;
            if (s.invulnTimer <= 0 && dxShip * dxShip + dyShip * dyShip < 16 * 16) {
              s.bullets.splice(i, 1);
              s.shields -= 1;
              s.invulnTimer = 55;
              setShields(s.shields);
              soundService.playExplosion();
              spawnExplosion(s.shipX, s.shipY, '#F43F5E', 18);

              if (s.shields <= 0) {
                s.status = 'GAME_OVER';
                setGameState('GAME_OVER');
                soundService.playGameOver();
                onGameOver(s.score, `Wave ${s.wave} · ${s.kills} drones destroyed`);
                break;
              }
            }
          }
        }

        // Update PowerUps
        for (let i = s.powerUps.length - 1; i >= 0; i--) {
          const p = s.powerUps[i];
          p.y += 1.8;
          const dxP = p.x - s.shipX;
          const dyP = p.y - s.shipY;
          if (dxP * dxP + dyP * dyP < 26 * 26) {
            if (p.kind === 'WEAPON') {
              s.weaponTier = 2;
              s.weaponTimer = 420;
            } else {
              s.shields = Math.min(4, s.shields + 1);
              setShields(s.shields);
            }
            s.score += 75;
            setScore(s.score);
            soundService.playScore();
            spawnExplosion(p.x, p.y, '#22D3EE', 10);
            s.powerUps.splice(i, 1);
            continue;
          }
          if (p.y > canvas.height + 20) {
            s.powerUps.splice(i, 1);
          }
        }

        // Update Enemies
        for (let i = s.enemies.length - 1; i >= 0; i--) {
          const en = s.enemies[i];
          en.y += en.speed;
          if (en.type === 'INTERCEPTOR') {
            en.phase += 0.06;
            en.x += Math.sin(en.phase) * 2.3;
          }

          en.shootCooldown -= 1;
          if (en.shootCooldown <= 0 && en.y > 20 && en.y < canvas.height - 90) {
            if (en.type === 'CRUISER') {
              s.bullets.push(
                { x: en.x - 10, y: en.y + 18, vx: -0.8, vy: 4.6, isEnemy: true },
                { x: en.x + 10, y: en.y + 18, vx: 0.8, vy: 4.6, isEnemy: true }
              );
              en.shootCooldown = 75;
            } else if (en.type === 'INTERCEPTOR') {
              s.bullets.push({ x: en.x, y: en.y + 14, vx: 0, vy: 5.0, isEnemy: true });
              en.shootCooldown = 95;
            }
          }

          // Check player bullet hits on enemy
          let destroyed = false;
          for (let j = s.bullets.length - 1; j >= 0; j--) {
            const b = s.bullets[j];
            if (b.isEnemy) continue;
            const dxb = b.x - en.x;
            const dyb = b.y - en.y;
            if (dxb * dxb + dyb * dyb <= (en.radius + 5) * (en.radius + 5)) {
              s.bullets.splice(j, 1);
              en.hp -= 1;
              spawnExplosion(b.x, b.y, '#38BDF8', 4);
              if (en.hp <= 0) {
                destroyed = true;
                const pts = en.type === 'CRUISER' ? 150 : en.type === 'INTERCEPTOR' ? 80 : 50;
                s.score += pts;
                s.kills += 1;
                setScore(s.score);
                soundService.playExplosion();
                spawnExplosion(
                  en.x,
                  en.y,
                  en.type === 'CRUISER' ? '#F59E0B' : '#E879F9',
                  16
                );
                if (Math.random() < 0.16) {
                  s.powerUps.push({
                    x: en.x,
                    y: en.y,
                    kind: Math.random() < 0.65 ? 'WEAPON' : 'SHIELD',
                  });
                }
                s.enemies.splice(i, 1);
                break;
              }
            }
          }
          if (destroyed) continue;

          // Check enemy collision with player ship
          const dxS = en.x - s.shipX;
          const dyS = en.y - s.shipY;
          if (s.invulnTimer <= 0 && dxS * dxS + dyS * dyS <= (en.radius + 15) * (en.radius + 15)) {
            s.enemies.splice(i, 1);
            s.shields -= 1;
            s.invulnTimer = 55;
            setShields(s.shields);
            soundService.playExplosion();
            spawnExplosion(s.shipX, s.shipY, '#F43F5E', 20);
            if (s.shields <= 0) {
              s.status = 'GAME_OVER';
              setGameState('GAME_OVER');
              soundService.playGameOver();
              onGameOver(s.score, `Wave ${s.wave} · ${s.kills} drones destroyed`);
              break;
            }
            continue;
          }

          if (en.y > canvas.height + 40) {
            s.enemies.splice(i, 1);
          }
        }
      }

      // Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.035;
        if (pt.life <= 0) s.particles.splice(i, 1);
      }

      // DRAW SCENE
      ctx.fillStyle = '#060A12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = '#94A3B8';
      s.stars.forEach((st) => {
        ctx.fillRect(st.x, st.y, st.size, st.size);
      });

      // PowerUps
      s.powerUps.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.kind === 'WEAPON' ? '#22D3EE' : '#10B981';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      // Bullets
      s.bullets.forEach((b) => {
        ctx.fillStyle = b.isEnemy ? '#F43F5E' : '#22D3EE';
        ctx.beginPath();
        ctx.roundRect(b.x - 2.5, b.y - 7, 5, 14, 2);
        ctx.fill();
      });

      // Enemies
      s.enemies.forEach((en) => {
        ctx.save();
        ctx.translate(en.x, en.y);
        if (en.type === 'CRUISER') {
          ctx.fillStyle = '#D97706';
          ctx.strokeStyle = '#FDE68A';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, en.radius);
          ctx.lineTo(en.radius, -en.radius * 0.6);
          ctx.lineTo(0, -en.radius);
          ctx.lineTo(-en.radius, -en.radius * 0.6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (en.type === 'INTERCEPTOR') {
          ctx.fillStyle = '#9333EA';
          ctx.strokeStyle = '#F0ABFC';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, en.radius);
          ctx.lineTo(en.radius, -en.radius);
          ctx.lineTo(-en.radius, -en.radius);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = '#E11D48';
          ctx.strokeStyle = '#FDA4AF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, en.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      });

      // Player Starhawk Ship
      if (s.invulnTimer % 4 < 2) {
        ctx.save();
        ctx.translate(s.shipX, s.shipY);
        ctx.fillStyle = '#0284C7';
        ctx.strokeStyle = '#67E8F9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(18, 16);
        ctx.lineTo(6, 11);
        ctx.lineTo(0, 17);
        ctx.lineTo(-6, 11);
        ctx.lineTo(-18, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#E0F2FE';
        ctx.beginPath();
        ctx.arc(0, -2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Particles
      s.particles.forEach((pt) => {
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x, pt.y, 3.5, 3.5);
      });
      ctx.globalAlpha = 1.0;

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
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
          <div className="text-xs text-slate-400">Hull Shields & Sector</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-emerald-400 font-mono-tabular flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              {shields} Shields
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-sm font-semibold text-purple-300 font-mono-tabular">Wave {wave}</span>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <button
            type="button"
            onClick={toggleAutoFire}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              autoFire
                ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                : 'border-slate-700 bg-slate-800 text-slate-400'
            }`}
          >
            Auto-Fire: {autoFire ? 'On' : 'Off'}
          </button>
          {gameState === 'PLAYING' || gameState === 'PAUSED' ? (
            <button
              type="button"
              onClick={togglePause}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Pause className="w-3.5 h-3.5" />
              {gameState === 'PAUSED' ? 'Resume' : 'Pause'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={resetGame}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>
      </div>

      {/* Canvas Arena */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#060A12]">
        <canvas
          ref={canvasRef}
          width={860}
          height={380}
          onPointerMove={(e) => {
            if (stateRef.current.status !== 'PLAYING') return;
            if (e.buttons > 0 || e.pointerType === 'touch') {
              const rect = e.currentTarget.getBoundingClientRect();
              const scaleX = e.currentTarget.width / rect.width;
              const scaleY = e.currentTarget.height / rect.height;
              stateRef.current.shipX = Math.max(
                26,
                Math.min(e.currentTarget.width - 26, (e.clientX - rect.left) * scaleX)
              );
              stateRef.current.shipY = Math.max(
                40,
                Math.min(e.currentTarget.height - 28, (e.clientY - rect.top) * scaleY)
              );
            }
          }}
          className="w-full h-[300px] sm:h-[380px] block touch-none"
        />

        {gameState === 'TITLE_MENU' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <Crosshair className="w-10 h-10 text-cyan-400 mb-3" />
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Space Shooter</h3>
            <p className="text-sm text-slate-300 max-w-md mb-5">
              Pilot the V-7 Starhawk with WASD / Arrow Keys or drag directly on the starfield. Destroy incoming alien squadrons and collect overdrive cores.
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
            <h3 className="text-2xl font-bold text-white mb-2">Mission Paused</h3>
            <div className="flex items-center gap-3 mt-3">
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
            <div className="text-xs font-medium text-rose-400 mb-1">Hull Shields Depleted</div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Starhawk Down</h3>
            <p className="text-sm text-slate-300 font-mono-tabular mb-5">
              Final Score: <span className="text-cyan-400 font-bold">{score.toLocaleString()} pts</span> · Reached Wave {wave}
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

      {/* Touch Controls Bar */}
      {showTouchControls && (
        <div className="grid grid-cols-5 gap-2">
          <button
            type="button"
            onPointerDown={() => (touchDirRef.current.dx = -1)}
            onPointerUp={() => (touchDirRef.current.dx = 0)}
            onPointerLeave={() => (touchDirRef.current.dx = 0)}
            className="py-3 rounded-xl bg-[#0E1525] border border-slate-800 active:border-cyan-400 text-slate-200 flex items-center justify-center select-none"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onPointerDown={() => (touchDirRef.current.dy = -1)}
            onPointerUp={() => (touchDirRef.current.dy = 0)}
            onPointerLeave={() => (touchDirRef.current.dy = 0)}
            className="py-3 rounded-xl bg-[#0E1525] border border-slate-800 active:border-cyan-400 text-slate-200 flex items-center justify-center select-none"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onPointerDown={() => (touchDirRef.current.dy = 1)}
            onPointerUp={() => (touchDirRef.current.dy = 0)}
            onPointerLeave={() => (touchDirRef.current.dy = 0)}
            className="py-3 rounded-xl bg-[#0E1525] border border-slate-800 active:border-cyan-400 text-slate-200 flex items-center justify-center select-none"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onPointerDown={() => (touchDirRef.current.dx = 1)}
            onPointerUp={() => (touchDirRef.current.dx = 0)}
            onPointerLeave={() => (touchDirRef.current.dx = 0)}
            className="py-3 rounded-xl bg-[#0E1525] border border-slate-800 active:border-cyan-400 text-slate-200 flex items-center justify-center select-none"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onPointerDown={() => (touchDirRef.current.firing = true)}
            onPointerUp={() => (touchDirRef.current.firing = false)}
            onPointerLeave={() => (touchDirRef.current.firing = false)}
            className="py-3 rounded-xl bg-cyan-500/15 border border-cyan-500/40 active:bg-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center justify-center select-none"
          >
            Fire Plasma
          </button>
        </div>
      )}
    </div>
  );
};
