import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundService } from '../services/soundService';
import { Play, RotateCcw, Zap, AlertTriangle } from 'lucide-react';

interface NeonReflexProps {
  bestScore: number;
  onGameOver: (score: number, detail: string) => void;
}

type ReflexPhase = 'IDLE' | 'WAITING' | 'SIGNAL' | 'FALSE_START' | 'ROUND_DONE' | 'SESSION_COMPLETE';

const TOTAL_ROUNDS = 5;

export const NeonReflexGame: React.FC<NeonReflexProps> = ({ bestScore, onGameOver }) => {
  const [phase, setPhase] = useState<ReflexPhase>('IDLE');
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundTimes, setRoundTimes] = useState<number[]>([]);
  const [lastTime, setLastTime] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const signalTimestampRef = useRef<number>(0);

  const clearScheduledTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearScheduledTimer();
  }, []);

  const startWaitingPhase = useCallback(() => {
    clearScheduledTimer();
    setPhase('WAITING');
    setLastTime(null);
    const randomDelay = 1300 + Math.floor(Math.random() * 2400);
    timerRef.current = window.setTimeout(() => {
      signalTimestampRef.current = performance.now();
      setPhase('SIGNAL');
      soundService.playReflexSignal();
    }, randomDelay);
  }, []);

  const startNewSession = useCallback(() => {
    soundService.playButton();
    setRoundIndex(0);
    setRoundTimes([]);
    setLastTime(null);
    startWaitingPhase();
  }, [startWaitingPhase]);

  const handleChamberTrigger = useCallback(() => {
    if (phase === 'IDLE' || phase === 'SESSION_COMPLETE') {
      startNewSession();
      return;
    }

    if (phase === 'WAITING') {
      clearScheduledTimer();
      setPhase('FALSE_START');
      soundService.playGameOver();
      return;
    }

    if (phase === 'FALSE_START') {
      startWaitingPhase();
      return;
    }

    if (phase === 'SIGNAL') {
      const elapsed = Math.max(1, Math.round(performance.now() - signalTimestampRef.current));
      soundService.playScore();
      const updated = [...roundTimes, elapsed];
      setRoundTimes(updated);
      setLastTime(elapsed);

      if (updated.length >= TOTAL_ROUNDS) {
        setPhase('SESSION_COMPLETE');
        const avg = Math.round(updated.reduce((acc, v) => acc + v, 0) / updated.length);
        const fastest = Math.min(...updated);
        onGameOver(avg, `Avg ${avg} ms · Best round ${fastest} ms`);
      } else {
        setPhase('ROUND_DONE');
        setRoundIndex(updated.length);
      }
      return;
    }

    if (phase === 'ROUND_DONE') {
      startWaitingPhase();
    }
  }, [phase, roundTimes, startNewSession, startWaitingPhase, onGameOver]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleChamberTrigger();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleChamberTrigger]);

  const averageMs =
    roundTimes.length > 0
      ? Math.round(roundTimes.reduce((acc, v) => acc + v, 0) / roundTimes.length)
      : 0;
  const sessionFastestMs = roundTimes.length > 0 ? Math.min(...roundTimes) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Top HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0E1525] border border-slate-800 rounded-xl p-3.5">
        <div>
          <div className="text-xs text-slate-400">Round Progress</div>
          <div className="text-xl font-bold text-slate-100 font-mono-tabular">
            {roundTimes.length} / {TOTAL_ROUNDS}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Session Average</div>
          <div className="text-xl font-bold text-cyan-400 font-mono-tabular">
            {averageMs > 0 ? `${averageMs} ms` : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Session Fastest</div>
          <div className="text-xl font-bold text-purple-300 font-mono-tabular">
            {sessionFastestMs > 0 ? `${sessionFastestMs} ms` : '—'}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div>
            <div className="text-xs text-slate-400">Personal Best Avg</div>
            <div className="text-sm font-bold text-emerald-400 font-mono-tabular">
              {bestScore > 0 ? `${bestScore} ms` : 'Unset'}
            </div>
          </div>
          <button
            type="button"
            onClick={startNewSession}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>
      </div>

      {/* Main Interactive Reaction Chamber */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          handleChamberTrigger();
        }}
        className={`w-full h-[300px] sm:h-[340px] rounded-xl border transition-colors flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
          phase === 'WAITING'
            ? 'bg-amber-950/50 border-amber-500/60 text-amber-200'
            : phase === 'SIGNAL'
            ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_50px_rgba(34,211,238,0.25)]'
            : phase === 'FALSE_START'
            ? 'bg-rose-950/60 border-rose-500/70 text-rose-200'
            : 'bg-[#090E1A] border-slate-800 text-slate-100 hover:border-slate-700'
        }`}
      >
        {phase === 'IDLE' && (
          <div className="flex flex-col items-center max-w-md">
            <Zap className="w-10 h-10 text-cyan-400 mb-3" />
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">Neon Reflex Chamber</h3>
            <p className="text-sm text-slate-300 mb-5">
              Complete 5 reaction rounds. Wait while the chamber is amber, then click, tap, or press Space the instant the cyan pulse fires.
            </p>
            <span className="px-6 py-2.5 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-sm inline-flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" />
              Start 5-Round Benchmark
            </span>
          </div>
        )}

        {phase === 'WAITING' && (
          <div className="flex flex-col items-center">
            <div className="text-xs font-semibold tracking-wider uppercase text-amber-400 mb-2">
              Round {roundIndex + 1} of {TOTAL_ROUNDS} · Chamber Armed
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-amber-100 mb-2">Hold Steady...</h3>
            <p className="text-sm text-amber-300/80">Wait for the cyan optical flash. Do not click early.</p>
          </div>
        )}

        {phase === 'SIGNAL' && (
          <div className="flex flex-col items-center">
            <div className="text-xs font-semibold tracking-wider uppercase text-cyan-300 mb-2">
              Optical Pulse Active
            </div>
            <h3 className="text-4xl sm:text-5xl font-bold text-white mb-2">STRIKE NOW!</h3>
            <p className="text-sm text-cyan-200">Click, Tap, or Press Spacebar immediately</p>
          </div>
        )}

        {phase === 'FALSE_START' && (
          <div className="flex flex-col items-center">
            <AlertTriangle className="w-10 h-10 text-rose-400 mb-2" />
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">False Start Detected</h3>
            <p className="text-sm text-rose-200 mb-4">
              You triggered before the cyan pulse fired. Tap or press Space to retry Round {roundIndex + 1}.
            </p>
            <span className="px-5 py-2 rounded-lg bg-rose-500 text-white font-semibold text-xs">
              Retry Round {roundIndex + 1}
            </span>
          </div>
        )}

        {phase === 'ROUND_DONE' && (
          <div className="flex flex-col items-center">
            <div className="text-xs text-slate-400 mb-1">
              Round {roundTimes.length} Recorded
            </div>
            <h3 className="text-4xl font-bold text-cyan-400 font-mono-tabular mb-2">
              {lastTime} ms
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              Tap anywhere or press Spacebar to arm Round {roundTimes.length + 1} of {TOTAL_ROUNDS}.
            </p>
            <span className="px-5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 font-semibold text-xs">
              Next Round
            </span>
          </div>
        )}

        {phase === 'SESSION_COMPLETE' && (
          <div className="flex flex-col items-center">
            <div className="text-xs text-emerald-400 font-medium mb-1">5-Round Benchmark Complete</div>
            <h3 className="text-3xl sm:text-4xl font-bold text-white font-mono-tabular mb-2">
              Average: {averageMs} ms
            </h3>
            <p className="text-sm text-slate-300 font-mono-tabular mb-5">
              Fastest Round: {sessionFastestMs} ms · Personal Best: {bestScore > 0 ? Math.min(bestScore, averageMs) : averageMs} ms
            </p>
            <span className="px-6 py-2.5 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-sm inline-flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Play Again
            </span>
          </div>
        )}
      </button>

      {/* Round-by-Round Telemetry Breakdown */}
      <div className="grid grid-cols-5 gap-2.5">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, idx) => {
          const val = roundTimes[idx];
          const isCurrent = idx === roundTimes.length && (phase === 'WAITING' || phase === 'SIGNAL' || phase === 'FALSE_START');
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-center ${
                val !== undefined
                  ? 'bg-[#0E1525] border-cyan-500/30'
                  : isCurrent
                  ? 'bg-[#0E1525] border-amber-500/40'
                  : 'bg-[#090D16] border-slate-800/80'
              }`}
            >
              <div className="text-xs text-slate-400 mb-1">Round {idx + 1}</div>
              <div className="text-base font-bold font-mono-tabular text-slate-100">
                {val !== undefined ? `${val} ms` : isCurrent ? 'Armed' : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
