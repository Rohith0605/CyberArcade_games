import 'package:flutter/material.dart';
import '../models/game_model.dart';
import '../services/storage_service.dart';
import '../games/cyber_runner/cyber_runner_game.dart';
import '../games/neon_reflex/neon_reflex_game.dart';
import '../games/memory_matrix/memory_matrix_game.dart';
import '../games/space_shooter/space_shooter_game.dart';
import '../games/cyber_snake/cyber_snake_game.dart';

class GameHostScreen extends StatefulWidget {
  final GameInfo game;
  final StorageService storage;
  final VoidCallback onBack;

  const GameHostScreen({
    super.key,
    required this.game,
    required this.storage,
    required this.onBack,
  });

  @override
  State<GameHostScreen> createState() => _GameHostScreenState();
}

class _GameHostScreenState extends State<GameHostScreen> {
  void _handleScore(int score, String detail) {
    widget.storage.recordScore(
      widget.game.id,
      score,
      detail,
      lowerIsBetter: widget.game.lowerIsBetter,
    );
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                onPressed: widget.onBack,
                icon: const Icon(Icons.arrow_back),
                label: const Text('Back to Arcade'),
              ),
              Text(
                '${widget.game.title} · Personal Best: ${widget.storage.getBestScore(widget.game.id)} ${widget.game.scoreUnit}',
                style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF22D3EE)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(child: _buildGameWidget()),
        ],
      ),
    );
  }

  Widget _buildGameWidget() {
    switch (widget.game.id) {
      case 'cyber_runner':
        return CyberRunnerWidget(onGameOver: _handleScore);
      case 'neon_reflex':
        return NeonReflexWidget(onGameOver: _handleScore);
      case 'memory_matrix':
        return MemoryMatrixWidget(onGameOver: _handleScore);
      case 'space_shooter':
        return SpaceShooterWidget(onGameOver: _handleScore);
      case 'cyber_snake':
      default:
        return CyberSnakeWidget(onGameOver: _handleScore);
    }
  }
}
