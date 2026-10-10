import 'package:flutter/material.dart';
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

  void _openGame(GameInfo game) {
    setState(() {
      _activeGame = game;
    });
  }

  void _closeGame() {
    setState(() {
      _activeGame = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cyber Arcade',
      debugShowCheckedModeBanner: false,
      theme: CyberTheme.darkTheme,
      home: Scaffold(
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(68),
          child: _buildTopBar(),
        ),
        body: _activeGame != null
            ? GameHostScreen(
                game: _activeGame!,
                storage: widget.storageService,
                onBack: _closeGame,
              )
            : _buildActiveScreen(),
      ),
    );
  }

  Widget _buildTopBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      decoration: const BoxDecoration(
        color: Color(0xFF090D16),
        border: Border(bottom: BorderSide(color: Color(0xFF1E293B))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          GestureDetector(
            onTap: () => setState(() {
              _activeGame = null;
              _currentTab = 'lobby';
            }),
            child: const Text(
              'Cyber Arcade',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
          Row(
            children: [
              _navLink('Lobby', 'lobby'),
              const SizedBox(width: 24),
              _navLink('Games Library', 'library'),
              const SizedBox(width: 24),
              _navLink('Leaderboard', 'leaderboard'),
              const SizedBox(width: 24),
              _navLink('Settings', 'settings'),
            ],
          ),
          ElevatedButton(
            onPressed: () => _openGame(GameCatalog.allGames.first),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF22D3EE),
              foregroundColor: const Color(0xFF090D16),
            ),
            child: const Text('Play Now'),
          ),
        ],
      ),
    );
  }

  Widget _navLink(String label, String tabId) {
    final isSelected = _activeGame == null && _currentTab == tabId;
    return TextButton(
      onPressed: () => setState(() {
        _activeGame = null;
        _currentTab = tabId;
      }),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? const Color(0xFF22D3EE) : const Color(0xFF94A3B8),
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildActiveScreen() {
    switch (_currentTab) {
      case 'library':
        return GamesLibraryScreen(
          storage: widget.storageService,
          onSelectGame: _openGame,
        );
      case 'leaderboard':
        return LeaderboardScreen(
          storage: widget.storageService,
          onSelectGame: _openGame,
        );
      case 'settings':
        return SettingsScreen(
          storage: widget.storageService,
          onChanged: () => setState(() {}),
        );
      case 'lobby':
      default:
        return HomeScreen(
          storage: widget.storageService,
          onSelectGame: _openGame,
          onNavigateTab: (tab) => setState(() => _currentTab = tab),
        );
    }
  }
}
