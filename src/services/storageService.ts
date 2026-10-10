import { ArcadePersistData, ArcadeSettings, GameId, ScoreEntry } from '../types/arcade';
import { soundService } from './soundService';

const STORAGE_KEY = 'cyber_arcade_persist_v1';

const DEFAULT_DATA: ArcadePersistData = {
  bestScores: {
    cyber_runner: 0,
    neon_reflex: 0,
    memory_matrix: 0,
    space_shooter: 0,
    cyber_snake: 0,
  },
  playCounts: {
    cyber_runner: 0,
    neon_reflex: 0,
    memory_matrix: 0,
    space_shooter: 0,
    cyber_snake: 0,
  },
  recentScores: [],
  recentlyPlayed: [],
  settings: {
    soundEnabled: true,
    reducedMotion: false,
    showTouchControls: true,
  },
};

export function loadArcadeData(): ArcadePersistData {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return structuredClone(DEFAULT_DATA);
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(DEFAULT_DATA);
    }
    const parsed = JSON.parse(raw) as Partial<ArcadePersistData>;
    const merged: ArcadePersistData = {
      bestScores: { ...DEFAULT_DATA.bestScores, ...(parsed.bestScores || {}) },
      playCounts: { ...DEFAULT_DATA.playCounts, ...(parsed.playCounts || {}) },
      recentScores: Array.isArray(parsed.recentScores) ? parsed.recentScores : [],
      recentlyPlayed: Array.isArray(parsed.recentlyPlayed) ? parsed.recentlyPlayed : [],
      settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
    };
    soundService.setEnabled(merged.settings.soundEnabled);
    return merged;
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

export function saveArcadeData(data: ArcadePersistData): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Also mirror keys using Flutter Web shared_preferences convention
    window.localStorage.setItem(
      'flutter.cyber_arcade_best_scores',
      JSON.stringify(data.bestScores)
    );
  } catch {
    // Gracefully handle quota or private browsing storage restrictions
  }
}

export function recordGameSession(
  current: ArcadePersistData,
  gameId: GameId,
  score: number,
  detail: string
): ArcadePersistData {
  const prevBest = current.bestScores[gameId] || 0;
  let newBest = prevBest;

  if (gameId === 'neon_reflex') {
    // For Neon Reflex, score is reaction time in ms (lower > 0 is better)
    if (score > 0 && (prevBest === 0 || score < prevBest)) {
      newBest = score;
    }
  } else {
    if (score > prevBest) {
      newBest = score;
    }
  }

  const newEntry: ScoreEntry = {
    id: `${gameId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    gameId,
    score,
    timestamp: new Date().toISOString(),
    detail,
  };

  const recentFiltered = current.recentlyPlayed.filter((id) => id !== gameId);
  const updatedRecentlyPlayed: GameId[] = [gameId, ...recentFiltered].slice(0, 5);

  const next: ArcadePersistData = {
    ...current,
    bestScores: {
      ...current.bestScores,
      [gameId]: newBest,
    },
    playCounts: {
      ...current.playCounts,
      [gameId]: (current.playCounts[gameId] || 0) + 1,
    },
    recentScores: [newEntry, ...current.recentScores].slice(0, 50),
    recentlyPlayed: updatedRecentlyPlayed,
  };

  saveArcadeData(next);
  return next;
}

export function updateArcadeSettings(
  current: ArcadePersistData,
  partial: Partial<ArcadeSettings>
): ArcadePersistData {
  const updatedSettings = {
    ...current.settings,
    ...partial,
  };
  soundService.setEnabled(updatedSettings.soundEnabled);
  const next: ArcadePersistData = {
    ...current,
    settings: updatedSettings,
  };
  saveArcadeData(next);
  return next;
}

export function clearAllArcadeRecords(current: ArcadePersistData): ArcadePersistData {
  const reset: ArcadePersistData = {
    ... structuredClone(DEFAULT_DATA),
    settings: current.settings,
  };
  saveArcadeData(reset);
  return reset;
}
