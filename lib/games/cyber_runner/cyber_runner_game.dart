import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class CyberRunnerWidget extends StatefulWidget {
  final void Function(int score, String detail) onGameOver;

  const CyberRunnerWidget({super.key, required this.onGameOver});

  @override
  State<CyberRunnerWidget> createState() => _CyberRunnerWidgetState();
}

class _CyberRunnerWidgetState extends State<CyberRunnerWidget> {
  Timer? _timer;
  bool _playing = false;
  double _playerY = 0;
  double _playerVy = 0;
  bool _sliding = false;
  int _jumpsLeft = 2;
  double _speed = 6.0;
  double _distance = 0;
  int _dodges = 0;
  final List<Rect> _obstacles = [];
  final Random _rng = Random();

  void _startGame() {
    _timer?.cancel();
    setState(() {
      _playing = true;
      _playerY = 0;
      _playerVy = 0;
      _sliding = false;
      _jumpsLeft = 2;
      _speed = 6.0;
      _distance = 0;
      _dodges = 0;
      _obstacles
        ..clear()
        ..add(const Rect.fromLTWH(650, 0, 32, 48));
    });
    _timer = Timer.periodic(const Duration(milliseconds: 16), (_) => _tick());
  }

  void _jump() {
    if (!_playing) return;
    if (_jumpsLeft > 0) {
      setState(() {
        _sliding = false;
        _playerVy = 12.5;
        _jumpsLeft--;
      });
    }
  }

  void _slide() {
    if (!_playing) return;
    setState(() => _sliding = true);
    Future.delayed(const Duration(milliseconds: 450), () {
      if (mounted) setState(() => _sliding = false);
    });
  }

  void _tick() {
    setState(() {
      _speed = min(14.0, 6.0 + _distance * 0.002);
      _distance += _speed * 0.18;
      _playerY += _playerVy;
      _playerVy -= 0.65;
      if (_playerY <= 0) {
        _playerY = 0;
        _playerVy = 0;
        _jumpsLeft = 2;
      }

      final playerHeight = _sliding ? 26.0 : 52.0;
      final playerRect = Rect.fromLTWH(80, _playerY, 34, playerHeight);

      for (int i = _obstacles.length - 1; i >= 0; i--) {
        final shifted = _obstacles[i].translate(-_speed, 0);
        _obstacles[i] = shifted;

        if (shifted.overlaps(playerRect)) {
          _playing = false;
          _timer?.cancel();
          final score = _distance.round() + _dodges * 25;
          widget.onGameOver(score, '${_distance.round()}m sprinted · $_dodges dodges');
          return;
        }

        if (shifted.right < 0) {
          _obstacles.removeAt(i);
          _dodges++;
        }
      }

      if (_obstacles.isEmpty || _obstacles.last.left < 420) {
        final nextX = 680.0 + _rng.nextInt(180);
        final isAerial = _rng.nextDouble() > 0.65;
        _obstacles.add(
          Rect.fromLTWH(nextX, isAerial ? 34 : 0, 34, isAerial ? 32 : 48),
        );
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final score = _distance.round() + _dodges * 25;
    return Focus(
      autofocus: true,
      onKeyEvent: (_, event) {
        if (event is KeyDownEvent) {
          if (event.logicalKey == LogicalKeyboardKey.space ||
              event.logicalKey == LogicalKeyboardKey.arrowUp) {
            _jump();
            return KeyEventResult.handled;
          } else if (event.logicalKey == LogicalKeyboardKey.arrowDown) {
            _slide();
            return KeyEventResult.handled;
          }
        }
        return KeyEventResult.ignored;
      },
      child: Column(
        children: [
          Text('Score: $score pts · Dodges: $_dodges', style: const TextStyle(fontSize: 18)),
          const SizedBox(height: 12),
          Expanded(
            child: GestureDetector(
              onTap: _playing ? _jump : _startGame,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFF070B14),
                  border: Border.all(color: const Color(0xFF1E293B)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: _playing
                      ? const Text('Sprinting Sector Highway — Tap or Space to Jump')
                      : ElevatedButton(
                          onPressed: _startGame,
                          child: const Text('Start Cyber Runner'),
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
