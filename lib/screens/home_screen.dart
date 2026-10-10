import 'package:flutter/material.dart';
import '../models/game_model.dart';
import '../services/storage_service.dart';
import '../widgets/game_card.dart';

class HomeScreen extends StatelessWidget {
  final StorageService storage;
  final ValueChanged<GameInfo> onSelectGame;
  final ValueChanged<String> onNavigateTab;

  const HomeScreen({
    super.key,
    required this.storage,
    required this.onSelectGame,
    required this.onNavigateTab,
  });

  @override
  Widget build(BuildContext context) {
    final featured = GameCatalog.allGames.first;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(36),
            decoration: BoxDecoration(
              color: const Color(0xFF0E1525),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF22D3EE).withOpacity(0.35)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ENTER THE ARCADE',
                  style: TextStyle(
                    fontSize: 42,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Choose from five original futuristic arcade games. Play directly in your browser, master desktop keyboard or mobile touch controls, and beat your local personal bests.',
                  style: TextStyle(fontSize: 16, color: Color(0xFFCBD5E1)),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    ElevatedButton(
                      onPressed: () => onSelectGame(featured),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF22D3EE),
                        foregroundColor: const Color(0xFF090D16),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                      ),
                      child: const Text('Play Now'),
                    ),
                    const SizedBox(width: 16),
                    OutlinedButton(
                      onPressed: () => onNavigateTab('library'),
                      child: const Text('Browse All 5 Games'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'All Arcade Cabinets (5 Games Available)',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 380,
              mainAxisExtent: 240,
              crossAxisSpacing: 20,
              mainAxisSpacing: 20,
            ),
            itemCount: GameCatalog.allGames.length,
            itemBuilder: (context, index) {
              final game = GameCatalog.allGames[index];
              return GameCard(
                game: game,
                bestScore: storage.getBestScore(game.id),
                onPlay: () => onSelectGame(game),
              );
            },
          ),
        ],
      ),
    );
  }
}
