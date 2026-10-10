import 'package:flutter/material.dart';
import '../models/game_model.dart';

class GameCard extends StatelessWidget {
  final GameInfo game;
  final int bestScore;
  final VoidCallback onPlay;

  const GameCard({
    super.key,
    required this.game,
    required this.bestScore,
    required this.onPlay,
  });

  @override
  Widget build(BuildContext context) {
    final bestLabel = bestScore > 0 ? '$bestScore ${game.scoreUnit}' : 'No Record';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${game.category} · ${game.difficulty} · Best: $bestLabel',
              style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
            ),
            const SizedBox(height: 8),
            Text(
              game.title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: Text(
                game.description,
                style: const TextStyle(fontSize: 14, color: Color(0xFFCBD5E1)),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onPlay,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF22D3EE),
                  foregroundColor: const Color(0xFF090D16),
                ),
                child: const Text('Play Game'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
