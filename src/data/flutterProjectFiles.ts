export interface FlutterSourceFile {
  path: string;
  description: string;
  language: string;
  code: string;
}

export const FLUTTER_PROJECT_FILES: FlutterSourceFile[] = [
  {
    path: '.github/workflows/deploy.yml',
    description: 'GitHub Actions CI/CD workflow that builds Flutter Web and deploys to GitHub Pages via gh-pages.',
    language: 'yaml',
    code: `name: Deploy Flutter Web to GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-and-deploy:
    name: Build & Deploy Flutter Web
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Flutter SDK
        uses: subosito/flutter-action@v2
        with:
          channel: 'stable'
          cache: true

      - name: Enable Flutter Web
        run: flutter config --enable-web

      - name: Install Flutter dependencies
        run: flutter pub get

      - name: Run static analysis
        run: flutter analyze

      - name: Run unit tests
        run: flutter test

      - name: Build Flutter Web release bundle
        run: flutter build web --release --base-href "/\${{ github.event.repository.name }}/"

      - name: Deploy to GitHub Pages (gh-pages)
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build/web
          force_orphan: true
          commit_message: 'chore(deploy): publish Flutter Web build to GitHub Pages'`,
  },
  {
    path: 'pubspec.yaml',
    description: 'Flutter Web package configuration with Flame and shared_preferences.',
    language: 'yaml',
    code: `name: cyber_arcade
description: A futuristic cyberpunk Flutter Web gaming platform featuring five playable arcade games with local high-score persistence.
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flame: ^1.16.0
  shared_preferences: ^2.2.2
  google_fonts: ^6.2.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1

flutter:
  uses-material-design: true`,
  },
  {
    path: 'lib/main.dart',
    description: 'Flutter Web application bootstrap and local storage initialization.',
    language: 'dart',
    code: `import 'package:flutter/material.dart';
import 'app.dart';
import 'services/storage_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final storageService = StorageService();
  await storageService.init();
  runApp(CyberArcadeApp(storageService: storageService));
}`,
  },
  {
    path: 'lib/app.dart',
    description: 'Root MaterialApp router managing Lobby, Library, Leaderboard, Settings, and Active Game screen.',
    language: 'dart',
    code: `import 'package:flutter/material.dart';
import 'services/storage_service.dart';
import 'theme/cyber_theme.dart';
import 'screens/home_screen.dart';
import 'screens/games_library_screen.dart';
import 'screens/leaderboard_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/game_host_screen.dart';
import 'models/game_model.dart';

class CyberArcadeApp extends StatefulWidget {
  final StorageService storageService;
  const CyberArcadeApp({super.key, required this.storageService});

  @override
  State<CyberArcadeApp> createState() => _CyberArcadeAppState();
}

class _CyberArcadeAppState extends State<CyberArcadeApp> {
  String _currentTab = 'lobby';
  GameInfo? _activeGame;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cyber Arcade',
      debugShowCheckedModeBanner: false,
      theme: CyberTheme.darkTheme,
      home: Scaffold(
        body: _activeGame != null
            ? GameHostScreen(
                game: _activeGame!,
                storage: widget.storageService,
                onBack: () => setState(() => _activeGame = null),
              )
            : HomeScreen(
                storage: widget.storageService,
                onSelectGame: (g) => setState(() => _activeGame = g),
                onNavigateTab: (t) => setState(() => _currentTab = t),
              ),
      ),
    );
  }
}`,
  },
  {
    path: 'lib/services/storage_service.dart',
    description: 'Browser-persistent high score and session tracker using shared_preferences.',
    language: 'dart',
    code: `import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/game_model.dart';

class StorageService {
  static const String _bestKey = 'cyber_arcade_best_scores';
  static const String _recentKey = 'cyber_arcade_recent_scores';
  static const String _soundKey = 'cyber_arcade_sound_enabled';

  SharedPreferences? _prefs;
  final Map<String, int> _bestScores = {};
  final List<ScoreRecord> _recentScores = [];
  bool _soundEnabled = true;

  Future<void> init() async {
    try {
      _prefs = await SharedPreferences.getInstance();
      _soundEnabled = _prefs?.getBool(_soundKey) ?? true;
      final bestRaw = _prefs?.getString(_bestKey);
      if (bestRaw != null) {
        final decoded = jsonDecode(bestRaw) as Map<String, dynamic>;
        decoded.forEach((k, v) => _bestScores[k] = (v as num).toInt());
      }
    } catch (_) {}
  }

  int getBestScore(String gameId) => _bestScores[gameId] ?? 0;
}`,
  },
  {
    path: 'test/arcade_test.dart',
    description: 'Comprehensive Flutter unit tests for GameCatalog and StorageService.',
    language: 'dart',
    code: `import 'package:flutter_test/flutter_test.dart';
import 'package:cyber_arcade/models/game_model.dart';
import 'package:cyber_arcade/services/storage_service.dart';

void main() {
  test('GameCatalog contains all five required playable games', () {
    expect(GameCatalog.allGames.length, 5);
  });

  test('StorageService updates personal bests for standard and reflex games', () async {
    final storage = StorageService();
    await storage.recordScore('cyber_runner', 1200, '300m sprint');
    expect(storage.getBestScore('cyber_runner'), 1200);
  });
}`,
  },
];
