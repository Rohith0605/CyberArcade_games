import 'package:flame/components.dart';
import 'package:flame/events.dart';
import 'package:flame/game.dart';
import 'package:flutter/material.dart';

class SpaceShooterFlameGame extends FlameGame with PanDetector {
  final void Function(int score, String detail) onGameOver;
  double playerX = 200;
  double playerY = 300;
  int score = 0;
  int shields = 3;

  SpaceShooterFlameGame({required this.onGameOver});

  @override
  void onPanUpdate(DragUpdateInfo info) {
    playerX = (playerX + info.delta.global.x).clamp(24, size.x - 24);
    playerY = (playerY + info.delta.global.y).clamp(40, size.y - 24);
  }
}

class SpaceShooterWidget extends StatelessWidget {
  final void Function(int score, String detail) onGameOver;

  const SpaceShooterWidget({super.key, required this.onGameOver});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: GameWidget(
        game: SpaceShooterFlameGame(onGameOver: onGameOver),
      ),
    );
  }
}
