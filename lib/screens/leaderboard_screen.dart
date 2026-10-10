import 'package:flutter/material.dart';
import '../models/game_model.dart';
import '../services/storage_service.dart';

class LeaderboardScreen extends StatelessWidget {
  final StorageService storage;
  final ValueChanged<GameInfo> onSelectGame;

  const LeaderboardScreen({
    super.key,
    required this.storage,
    required this.onSelectGame,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Local Leaderboard & Personal Bests',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 6),
          const Text(
            'All scores are stored locally on your current browser/device via shared_preferences.',
            style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 24),
          ...GameCatalog.allGames.map((game) {
            final best = storage.getBestScore(game.id);
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                title: Text(game.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${game.category} · ${game.difficulty}'),
                trailing: Text(
                  best > 0 ? '$best ${game.scoreUnit}' : 'Unset',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF22D3EE),
                  ),
                ),
                onTap: () => onSelectGame(game),
              ),
            );
          }),
        ],
      ),
    );
  }
}
