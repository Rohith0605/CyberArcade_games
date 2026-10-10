export type GameId =
  | 'cyber_runner'
  | 'neon_reflex'
  | 'memory_matrix'
  | 'space_shooter'
  | 'cyber_snake';

export type GameCategory = 'All' | 'Action' | 'Reflex' | 'Puzzle' | 'Arcade';

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY' | 'GAME_OVER';

export interface GameMetadata {
  id: GameId;
  title: string;
  subtitle: string;
  category: Exclude<GameCategory, 'All'>;
  difficulty: 'Accessible' | 'Moderate' | 'Challenging';
  scoreUnit: string;
  lowerIsBetter?: boolean;
  description: string;
  desktopControls: string;
  mobileControls: string;
  rules: string[];
  accentColor: string;
  image: string;
  featured?: boolean;
}

export interface ScoreEntry {
  id: string;
  gameId: GameId;
  score: number;
  timestamp: string;
  detail: string;
}

export interface ArcadeSettings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  showTouchControls: boolean;
}

export interface ArcadePersistData {
  bestScores: Record<GameId, number>;
  playCounts: Record<GameId, number>;
  recentScores: ScoreEntry[];
  recentlyPlayed: GameId[];
  settings: ArcadeSettings;
}
