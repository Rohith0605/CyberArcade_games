/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  GAMES_CATALOG,
  HERO_BANNER_IMAGE,
  getGameById,
} from './data/gamesCatalog';
import {
  ArcadePersistData,
  GameCategory,
  GameId,
  GameMetadata,
} from './types/arcade';
import {
  loadArcadeData,
  recordGameSession,
  updateArcadeSettings,
  clearAllArcadeRecords,
} from './services/storageService';
import { soundService } from './services/soundService';
import { GameCard } from './components/GameCard';
import { CyberRunnerGame } from './games/CyberRunnerGame';
import { NeonReflexGame } from './games/NeonReflexGame';
import { MemoryMatrixGame } from './games/MemoryMatrixGame';
import { SpaceShooterGame } from './games/SpaceShooterGame';
import { CyberSnakeGame } from './games/CyberSnakeGame';
import { FLUTTER_PROJECT_FILES } from './data/flutterProjectFiles';
import {
  Play,
  ArrowLeft,
  Search,
  Volume2,
  VolumeX,
  Trash2,
  Keyboard,
  Smartphone,
  Trophy,
  Code2,
  Copy,
  Check,
} from 'lucide-react';

type ActiveTab = 'lobby' | 'library' | 'leaderboard' | 'settings' | 'flutter_source';

export default function App() {
  const [persistData, setPersistData] = useState<ArcadePersistData>(() =>
    loadArcadeData()
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('lobby');
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);

  // Library filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('All');

  // Leaderboard filters
  const [leaderboardFilterGame, setLeaderboardFilterGame] = useState<string>('ALL');
  const [leaderboardSortBy, setLeaderboardSortBy] = useState<'RECENT' | 'BEST'>('BEST');

  // Settings confirmation modal
  const [confirmClearModal, setConfirmClearModal] = useState(false);

  // Hero fallback state
  const [heroImgError, setHeroImgError] = useState(false);

  // Copy feedback for Flutter Source viewer
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleLaunchGame = (game: GameMetadata) => {
    soundService.playButton();
    setActiveGameId(game.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGameOver = (gameId: GameId, score: number, detail: string) => {
    setPersistData((prev) => recordGameSession(prev, gameId, score, detail));
  };

  const handleNavigateTab = (tab: ActiveTab) => {
    soundService.playButton();
    setActiveGameId(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPlays = useMemo(() => {
    return (Object.values(persistData.playCounts) as number[]).reduce(
      (sum, val) => sum + val,
      0
    );
  }, [persistData.playCounts]);

  const recordsSetCount = useMemo(() => {
    return (Object.values(persistData.bestScores) as number[]).filter((v) => v > 0)
      .length;
  }, [persistData.bestScores]);

  const featuredGame = GAMES_CATALOG[0]; // Cyber Runner

  const filteredLibraryGames = useMemo(() => {
    return GAMES_CATALOG.filter((game) => {
      const matchesCategory =
        selectedCategory === 'All' || game.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        game.title.toLowerCase().includes(q) ||
        game.subtitle.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q) ||
        game.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const sortedRecentScores = useMemo(() => {
    const filtered = persistData.recentScores.filter(
      (entry) =>
        leaderboardFilterGame === 'ALL' || entry.gameId === leaderboardFilterGame
    );
    if (leaderboardSortBy === 'RECENT') {
      return filtered;
    }
    return [...filtered].sort((a, b) => {
      if (a.gameId === 'neon_reflex' && b.gameId === 'neon_reflex') {
        return a.score - b.score;
      }
      return b.score - a.score;
    });
  }, [persistData.recentScores, leaderboardFilterGame, leaderboardSortBy]);

  const copyText = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedPath(key);
    window.setTimeout(() => setCopiedPath(null), 1800);
  };

  const activeGame = activeGameId ? getGameById(activeGameId) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-slate-100 cyber-grid-bg">
      {/* Top Bar Contract: Strictly 1 row, 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/90">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#lobby"
            onClick={(e) => {
              e.preventDefault();
              handleNavigateTab('lobby');
            }}
            className="text-xl font-bold tracking-tight text-white hover:text-cyan-300 transition-colors font-display whitespace-nowrap shrink-0"
          >
            Cyber Arcade
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav className="flex items-center gap-4 sm:gap-7 overflow-x-auto no-scrollbar text-sm font-medium">
            {(
              [
                { id: 'lobby', label: 'Lobby' },
                { id: 'library', label: 'Games Library' },
                { id: 'leaderboard', label: 'Leaderboard' },
                { id: 'settings', label: 'Settings' },
                { id: 'flutter_source', label: 'Flutter Source' },
              ] as { id: ActiveTab; label: string }[]
            ).map((item) => {
              const isCurrent = activeGameId === null && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigateTab(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isCurrent
                      ? 'text-cyan-400 border-cyan-400 font-semibold'
                      : 'text-slate-300 border-transparent hover:text-white hover:border-slate-600'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => handleLaunchGame(featuredGame)}
              className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Play Now
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-8 py-8">
        {activeGame ? (
          /* C. INDIVIDUAL GAME SCREEN */
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    soundService.playButton();
                    setActiveGameId(null);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#0E1525] border border-slate-800 hover:border-cyan-500/50 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-cyan-400" />
                  Back to Arcade
                </button>
                <div>
                  <div className="text-xs text-slate-400 font-mono-tabular">
                    {activeGame.category} · {activeGame.difficulty} ·{' '}
                    {persistData.playCounts[activeGame.id] || 0} sessions played
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {activeGame.title}
                  </h1>
                </div>
              </div>

              {/* Quick Switch Cabinet Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {GAMES_CATALOG.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleLaunchGame(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      g.id === activeGame.id
                        ? 'bg-cyan-400 text-slate-950 font-semibold'
                        : 'bg-[#0E1525] border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {g.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Playable Game Viewport */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                {activeGame.id === 'cyber_runner' && (
                  <CyberRunnerGame
                    bestScore={persistData.bestScores.cyber_runner}
                    showTouchControls={persistData.settings.showTouchControls}
                    onGameOver={(score, detail) =>
                      handleGameOver('cyber_runner', score, detail)
                    }
                  />
                )}
                {activeGame.id === 'neon_reflex' && (
                  <NeonReflexGame
                    bestScore={persistData.bestScores.neon_reflex}
                    onGameOver={(score, detail) =>
                      handleGameOver('neon_reflex', score, detail)
                    }
                  />
                )}
                {activeGame.id === 'memory_matrix' && (
                  <MemoryMatrixGame
                    bestScore={persistData.bestScores.memory_matrix}
                    onGameOver={(score, detail) =>
                      handleGameOver('memory_matrix', score, detail)
                    }
                  />
                )}
                {activeGame.id === 'space_shooter' && (
                  <SpaceShooterGame
                    bestScore={persistData.bestScores.space_shooter}
                    showTouchControls={persistData.settings.showTouchControls}
                    onGameOver={(score, detail) =>
                      handleGameOver('space_shooter', score, detail)
                    }
                  />
                )}
                {activeGame.id === 'cyber_snake' && (
                  <CyberSnakeGame
                    bestScore={persistData.bestScores.cyber_snake}
                    showTouchControls={persistData.settings.showTouchControls}
                    onGameOver={(score, detail) =>
                      handleGameOver('cyber_snake', score, detail)
                    }
                  />
                )}
              </div>

              {/* Game Instructions & Controls Sidebar */}
              <aside className="lg:col-span-4 bg-[#0E1525] border border-slate-800 rounded-xl p-5 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-white mb-1.5">
                    Cabinet Overview
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {activeGame.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Controls Reference
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="font-semibold text-slate-200 mb-0.5">
                        Desktop Keyboard & Mouse
                      </div>
                      <p className="text-slate-400">{activeGame.desktopControls}</p>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200 mb-0.5">
                        Mobile & Tablet Touch
                      </div>
                      <p className="text-slate-400">{activeGame.mobileControls}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-300">
                    How to Play & Scoring
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {activeGame.rules.map((rule, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {idx + 1}. {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </section>
        ) : activeTab === 'lobby' ? (
          /* A. HOME / ARCADE LOBBY */
          <div className="space-y-12">
            {/* Hero Split Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 bg-[#0E1525] border border-slate-800 rounded-2xl p-6 sm:p-10 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-xs font-mono-tabular text-cyan-400">
                    5 Playable Browser Cabinets · Local High-Score Persistence · Zero Latency
                  </div>
                  <h1
                    className="text-3xl sm:text-5xl font-bold text-white tracking-tight font-display"
                    style={{ textWrap: 'balance' }}
                  >
                    ENTER THE ARCADE
                  </h1>
                  <p className="text-base text-slate-300 leading-relaxed max-w-xl">
                    Step inside Cyber Arcade—a futuristic web gaming platform featuring five complete, original arcade games. Play directly in your browser with desktop keyboard or mobile touch controls and challenge your personal bests.
                  </p>
                </div>

                <div className="pt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleLaunchGame(featuredGame)}
                    className="px-6 py-3 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-sm hover:bg-cyan-300 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Play Now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateTab('library')}
                    className="px-5 py-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-semibold text-sm hover:border-cyan-400/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Open Games Library
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateTab('leaderboard')}
                    className="px-5 py-3 rounded-lg bg-transparent text-slate-300 hover:text-white font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    View Leaderboard
                  </button>
                </div>
              </div>

              {/* Hero Artwork Showcase */}
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-slate-800 bg-[#090D16] min-h-[260px]">
                {!heroImgError ? (
                  <img
                    src={HERO_BANNER_IMAGE}
                    alt="Cyber Arcade futuristic neon cabinet hall"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgError(true)}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-950 via-slate-900 to-purple-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-6 flex flex-col justify-end">
                  <div className="text-xs font-mono-tabular text-cyan-300 mb-1">
                    Featured Cabinet · Action Runner
                  </div>
                  <div className="text-xl font-bold text-white mb-1">
                    {featuredGame.title}: {featuredGame.subtitle}
                  </div>
                  <div className="text-xs text-slate-300 font-mono-tabular">
                    Personal Best:{' '}
                    {persistData.bestScores.cyber_runner > 0
                      ? `${persistData.bestScores.cyber_runner.toLocaleString()} pts`
                      : 'Unset — Start a run'}
                  </div>
                </div>
              </div>
            </section>

            {/* Full-Width 4-Column Arcade Telemetry & Statistics Strip */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0E1525] border border-slate-800 rounded-xl p-5">
                <div className="text-xs text-slate-400 mb-1">Total Games Available</div>
                <div className="text-2xl font-bold text-white font-mono-tabular">
                  5 Cabinets
                </div>
                <div className="text-xs text-cyan-400 mt-1">
                  Action · Reflex · Puzzle · Arcade
                </div>
              </div>
              <div className="bg-[#0E1525] border border-slate-800 rounded-xl p-5">
                <div className="text-xs text-slate-400 mb-1">Total Sessions Played</div>
                <div className="text-2xl font-bold text-cyan-400 font-mono-tabular">
                  {totalPlays.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Saved in local browser storage
                </div>
              </div>
              <div className="bg-[#0E1525] border border-slate-800 rounded-xl p-5">
                <div className="text-xs text-slate-400 mb-1">Personal Bests Established</div>
                <div className="text-2xl font-bold text-purple-300 font-mono-tabular">
                  {recordsSetCount} / 5 Games
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Beat your local high scores
                </div>
              </div>
              <div className="bg-[#0E1525] border border-slate-800 rounded-xl p-5">
                <div className="text-xs text-slate-400 mb-1">Recently Played</div>
                <div className="text-lg font-bold text-white truncate">
                  {persistData.recentlyPlayed.length > 0
                    ? getGameById(persistData.recentlyPlayed[0]).title
                    : 'No Recent Session'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {persistData.recentlyPlayed.length > 0
                    ? 'Click any game below to resume'
                    : 'Choose a cabinet below to begin'}
                </div>
              </div>
            </section>

            {/* Featured Game & Recently Played Highlight */}
            <section className="bg-[#0E1525] border border-slate-800 rounded-2xl p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 space-y-3">
                  <div className="text-xs font-mono-tabular text-cyan-400">
                    Featured Spotlight · High-Speed Endless Runner
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    {featuredGame.title}
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {featuredGame.description}
                  </p>
                  <div className="text-xs text-slate-400 font-mono-tabular pt-1">
                    Controls: {featuredGame.desktopControls}
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleLaunchGame(featuredGame)}
                      className="px-5 py-2.5 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm hover:bg-cyan-300 transition-colors inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Launch {featuredGame.title}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Recently Played Cabinets
                  </div>
                  {persistData.recentlyPlayed.length === 0 ? (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      You have not completed a session yet. Launch any of the five games below to track your recent sessions and personal bests automatically.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {persistData.recentlyPlayed.slice(0, 3).map((gId) => {
                        const gm = getGameById(gId);
                        const best = persistData.bestScores[gId];
                        return (
                          <div
                            key={gId}
                            className="flex items-center justify-between gap-3 py-2 border-b border-slate-800/70 last:border-b-0"
                          >
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {gm.title}
                              </div>
                              <div className="text-xs text-slate-400 font-mono-tabular">
                                Best: {best > 0 ? `${best.toLocaleString()} ${gm.scoreUnit}` : '—'} ·{' '}
                                {persistData.playCounts[gId] || 0} plays
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleLaunchGame(gm)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-400 hover:text-slate-950 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer"
                            >
                              Play
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* All 5 Games Grid */}
            <section className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    All Five Arcade Cabinets
                  </h2>
                  <p className="text-sm text-slate-400">
                    Select any game below to play immediately in your browser.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigateTab('library')}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Search & Filter in Games Library →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {GAMES_CATALOG.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    bestScore={persistData.bestScores[game.id] || 0}
                    playCount={persistData.playCounts[game.id] || 0}
                    onPlay={handleLaunchGame}
                  />
                ))}
              </div>
            </section>

            {/* Instructions for Keyboard and Touch Controls */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-[#0E1525] border border-slate-800 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-cyan-400 font-semibold text-sm">
                  <Keyboard className="w-4 h-4" />
                  Desktop Keyboard & Mouse Controls
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  All five games respond immediately to standard desktop inputs: use{' '}
                  <span className="text-white font-mono-tabular">Arrow Keys</span> or{' '}
                  <span className="text-white font-mono-tabular">WASD</span> for movement and steering,{' '}
                  <span className="text-white font-mono-tabular">Spacebar</span> to jump, fire plasma, or trigger reflex pulses, and{' '}
                  <span className="text-white font-mono-tabular">P</span> or{' '}
                  <span className="text-white font-mono-tabular">Esc</span> to pause active action games.
                </p>
              </div>

              <div className="bg-[#0E1525] border border-slate-800 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-purple-300 font-semibold text-sm">
                  <Smartphone className="w-4 h-4" />
                  Mobile & Tablet Touch Controls
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Playing on a touchscreen device? Every game includes dedicated touch controls below the arena canvas plus direct canvas gestures (tap to jump or react, drag to pilot the Starhawk, or swipe to steer Cyber Snake).
                </p>
              </div>
            </section>
          </div>
        ) : activeTab === 'library' ? (
          /* B. GAMES LIBRARY */
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Games Library</h1>
                <p className="text-sm text-slate-400">
                  Browse, search, and filter all {GAMES_CATALOG.length} playable Cyber Arcade titles.
                </p>
              </div>

              {/* Search & Category Filter Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search games by name..."
                    aria-label="Search games by name"
                    className="pl-9 pr-4 py-2 rounded-lg bg-[#0E1525] border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-60"
                  />
                </div>

                {/* Interactive Segmented Filter Bar */}
                <div className="flex items-center gap-1 p-1 bg-[#0E1525] border border-slate-800 rounded-lg">
                  {(['All', 'Action', 'Reflex', 'Puzzle', 'Arcade'] as GameCategory[]).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          soundService.playButton();
                          setSelectedCategory(cat);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-cyan-400 text-slate-950 font-semibold'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {filteredLibraryGames.length === 0 ? (
              <div className="bg-[#0E1525] border border-slate-800 rounded-xl p-12 text-center space-y-3">
                <div className="text-lg font-bold text-white">
                  No matching games found
                </div>
                <p className="text-sm text-slate-400">
                  No arcade cabinets matched "{searchQuery}" in the {selectedCategory} category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-xs hover:bg-cyan-300 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLibraryGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    bestScore={persistData.bestScores[game.id] || 0}
                    playCount={persistData.playCounts[game.id] || 0}
                    onPlay={handleLaunchGame}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'leaderboard' ? (
          /* D. LEADERBOARD / STATISTICS */
          <div className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Leaderboard & Local Statistics
                </h1>
                <p className="text-sm text-slate-400">
                  Scores are stored locally on your current browser and device—not shared globally.
                </p>
              </div>
              <div className="text-xs font-mono-tabular text-cyan-400">
                Total Sessions Recorded: {totalPlays}
              </div>
            </div>

            {/* Personal Bests Per Game Table */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyan-400" />
                Personal Best High Scores by Game
              </h2>
              <div className="bg-[#0E1525] border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                        <th className="py-3.5 px-5">Game Cabinet</th>
                        <th className="py-3.5 px-5">Category & Difficulty</th>
                        <th className="py-3.5 px-5">Sessions Played</th>
                        <th className="py-3.5 px-5">Personal Best</th>
                        <th className="py-3.5 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 text-sm">
                      {GAMES_CATALOG.map((game) => {
                        const best = persistData.bestScores[game.id] || 0;
                        const plays = persistData.playCounts[game.id] || 0;
                        return (
                          <tr key={game.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-4 px-5 font-semibold text-white">
                              {game.title}
                            </td>
                            <td className="py-4 px-5 text-slate-400 text-xs">
                              {game.category} · {game.difficulty}
                            </td>
                            <td className="py-4 px-5 font-mono-tabular text-slate-300">
                              {plays.toLocaleString()}
                            </td>
                            <td className="py-4 px-5 font-mono-tabular font-bold text-cyan-400">
                              {best > 0
                                ? `${best.toLocaleString()} ${game.scoreUnit}`
                                : 'No Record Yet'}
                            </td>
                            <td className="py-4 px-5 text-right">
                              <button
                                type="button"
                                onClick={() => handleLaunchGame(game)}
                                className="px-3.5 py-1.5 rounded-lg bg-cyan-400/15 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Play Now
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Recent Game Sessions Log with Filtering & Sorting */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-white">Recent Game Results</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={leaderboardFilterGame}
                    onChange={(e) => setLeaderboardFilterGame(e.target.value)}
                    aria-label="Filter scores by game"
                    className="px-3 py-1.5 rounded-lg bg-[#0E1525] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ALL">All 5 Games</option>
                    {GAMES_CATALOG.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 p-1 bg-[#0E1525] border border-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setLeaderboardSortBy('BEST')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        leaderboardSortBy === 'BEST'
                          ? 'bg-cyan-400 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Sort by Score Value
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaderboardSortBy('RECENT')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        leaderboardSortBy === 'RECENT'
                          ? 'bg-cyan-400 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Sort by Most Recent
                    </button>
                  </div>
                </div>
              </div>

              {sortedRecentScores.length === 0 ? (
                <div className="bg-[#0E1525] border border-slate-800 rounded-xl p-10 text-center space-y-2">
                  <div className="text-base font-semibold text-white">
                    No local game sessions recorded yet
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Complete a round in any of the five games to populate your local session history and benchmark metrics.
                  </p>
                </div>
              ) : (
                <div className="bg-[#0E1525] border border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                          <th className="py-3 px-5">Game</th>
                          <th className="py-3 px-5">Result Score</th>
                          <th className="py-3 px-5">Session Telemetry</th>
                          <th className="py-3 px-5 text-right">Recorded</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 text-sm">
                        {sortedRecentScores.slice(0, 20).map((entry) => {
                          const gm = getGameById(entry.gameId);
                          const dateStr = new Date(entry.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          });
                          return (
                            <tr key={entry.id} className="hover:bg-slate-900/40">
                              <td className="py-3.5 px-5 font-semibold text-white">
                                {gm.title}
                              </td>
                              <td className="py-3.5 px-5 font-mono-tabular font-bold text-cyan-400">
                                {entry.score.toLocaleString()} {gm.scoreUnit}
                              </td>
                              <td className="py-3.5 px-5 text-xs text-slate-300 font-mono-tabular">
                                {entry.detail}
                              </td>
                              <td className="py-3.5 px-5 text-right text-xs text-slate-400 font-mono-tabular">
                                {dateStr}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : activeTab === 'settings' ? (
          /* E. SETTINGS */
          <div className="max-w-3xl space-y-8">
            <div className="pb-6 border-b border-slate-800">
              <h1 className="text-3xl font-bold text-white mb-1">Arcade Settings</h1>
              <p className="text-sm text-slate-400">
                Configure synthesized audio, touch controls, control guides, and local browser storage.
              </p>
            </div>

            {/* Preferences Toggles */}
            <section className="bg-[#0E1525] border border-slate-800 rounded-xl divide-y divide-slate-800">
              <div className="p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-white flex items-center gap-2">
                    {persistData.settings.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    Synthesized Arcade Sound Effects
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Enable Web Audio API sound effects for jumps, plasma lasers, sequence tones, and score pickups.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !persistData.settings.soundEnabled;
                    setPersistData((prev) =>
                      updateArcadeSettings(prev, { soundEnabled: nextVal })
                    );
                    if (nextVal) soundService.playScore();
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    persistData.settings.soundEnabled
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {persistData.settings.soundEnabled ? 'Sound: On' : 'Sound: Off'}
                </button>
              </div>

              <div className="p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-white">
                    On-Screen Mobile Touch Controls
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Display interactive Jump, Slide, Directional D-Pad, and Fire buttons beneath game arenas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundService.playButton();
                    setPersistData((prev) =>
                      updateArcadeSettings(prev, {
                        showTouchControls: !prev.settings.showTouchControls,
                      })
                    );
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    persistData.settings.showTouchControls
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {persistData.settings.showTouchControls ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </section>

            {/* Controls Reference Table */}
            <section className="bg-[#0E1525] border border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Complete Controls Guide</h2>
              <div className="divide-y divide-slate-800/80 text-xs">
                {GAMES_CATALOG.map((g) => (
                  <div key={g.id} className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="font-semibold text-white">{g.title}</div>
                    <div className="text-slate-300">
                      <span className="text-cyan-400 font-medium">Desktop:</span> {g.desktopControls}
                    </div>
                    <div className="text-slate-300">
                      <span className="text-purple-300 font-medium">Touch:</span> {g.mobileControls}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Clear Local Records Section */}
            <section className="bg-[#0E1525] border border-slate-800 rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white">Local Data Management</h2>
                <p className="text-xs text-slate-400 mt-1">
                  All high scores, play counts, and session logs are stored locally in your browser. Clearing records resets all five games to zero.
                </p>
              </div>

              {!confirmClearModal ? (
                <button
                  type="button"
                  onClick={() => {
                    soundService.playButton();
                    setConfirmClearModal(true);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white font-semibold text-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Local Game Records
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/50 space-y-3">
                  <div className="text-sm font-bold text-white">
                    Confirm Permanent Local Reset?
                  </div>
                  <p className="text-xs text-rose-200">
                    This action will delete all personal bests ({recordsSetCount} records) and {totalPlays} recorded game sessions from this browser.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playGameOver();
                        setPersistData((prev) => clearAllArcadeRecords(prev));
                        setConfirmClearModal(false);
                      }}
                      className="px-4 py-2 rounded-lg bg-rose-500 text-white font-semibold text-xs hover:bg-rose-400 transition-colors cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearModal(false)}
                      className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          /* FLUTTER SOURCE & GITHUB EXPORT */
          <div className="space-y-8">
            <div className="pb-6 border-b border-slate-800">
              <div className="text-xs font-mono-tabular text-cyan-400 mb-1">
                Flutter Web Architecture & GitHub Repository Package
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Flutter Web Source & GitHub Transfer
              </h1>
              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                All Flutter Web Dart source files (<code className="text-cyan-300">lib/main.dart</code>,{' '}
                <code className="text-cyan-300">lib/app.dart</code>, <code className="text-cyan-300">lib/models/</code>,{' '}
                <code className="text-cyan-300">lib/screens/</code>, <code className="text-cyan-300">lib/games/</code>,{' '}
                <code className="text-cyan-300">lib/services/</code>, <code className="text-cyan-300">pubspec.yaml</code>,{' '}
                <code className="text-cyan-300">test/arcade_test.dart</code>, <code className="text-cyan-300">.github/workflows/deploy.yml</code>, and <code className="text-cyan-300">README.md</code>) are configured and committed for your repository{' '}
                <a
                  href="https://github.com/Rohith0605/Cyber-acrade_webgames"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  github.com/Rohith0605/Cyber-acrade_webgames
                </a>.
              </p>
            </div>

            {/* GitHub Push Instructions Box */}
            <section className="bg-[#0E1525] border border-slate-800 rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  Git Commit & GitHub Push Commands (`Rohith0605/Cyber-acrade_webgames`)
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      'git_cmds',
                      `git init\ngit add .\ngit commit -m "feat: complete Cyber Arcade Flutter Web gaming platform with 5 playable games"\ngit branch -M main\ngit remote add origin https://github.com/Rohith0605/Cyber-acrade_webgames.git\ngit push -u origin main`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedPath === 'git_cmds' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Git Commands
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-[#070B14] border border-slate-800 text-xs text-slate-200 font-mono-tabular overflow-x-auto leading-relaxed">
{`git init
git add .
git commit -m "feat: complete Cyber Arcade Flutter Web gaming platform with 5 playable games"
git branch -M main
git remote add origin https://github.com/Rohith0605/Cyber-acrade_webgames.git
git push -u origin main`}
              </pre>
            </section>

            {/* Key Flutter Files Inspector */}
            <section className="space-y-4">
              {FLUTTER_PROJECT_FILES.map((file) => (
                <div
                  key={file.path}
                  className="bg-[#0E1525] border border-slate-800 rounded-xl overflow-hidden"
                >
                  <div className="px-5 py-3.5 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-sm font-bold text-cyan-300 font-mono-tabular">
                        {file.path}
                      </span>
                      <span className="text-xs text-slate-400 ml-3">
                        {file.description}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(file.path, file.code)}
                      className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedPath === file.path ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy File
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-5 text-xs text-slate-300 font-mono-tabular overflow-x-auto leading-relaxed max-h-80">
                    {file.code}
                  </pre>
                </div>
              ))}
            </section>
          </div>
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090D16] py-6 px-4 sm:px-8 mt-12">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            Cyber Arcade · Futuristic Web Gaming Platform · Local Browser Storage Enabled
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => handleNavigateTab('lobby')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Lobby
            </button>
            <button
              type="button"
              onClick={() => handleNavigateTab('library')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Games Library
            </button>
            <button
              type="button"
              onClick={() => handleNavigateTab('leaderboard')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Leaderboard
            </button>
            <button
              type="button"
              onClick={() => handleNavigateTab('settings')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
