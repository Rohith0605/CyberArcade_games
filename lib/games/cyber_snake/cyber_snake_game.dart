import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

class CyberSnakeWidget extends StatefulWidget {
  final void Function(int score, String detail) onGameOver;

  const CyberSnakeWidget({super.key, required this.onGameOver});

  @override
  State<CyberSnakeWidget> createState() => _CyberSnakeWidgetState();
}

class _CyberSnakeWidgetState extends State<CyberSnakeWidget> {
  static const int cols = 20;
  static const int rows = 15;
  final List<Point<int>> _snake = [const Point(8, 7), const Point(7, 7), const Point(6, 7)];
  Point<int> _dir = const Point(1, 0);
  Point<int> _orb = const Point(13, 7);
  Timer? _timer;
  int _score = 0;

  void _start() {
    _timer?.cancel();
    setState(() {
      _snake
        ..clear()
        ..addAll([const Point(8, 7), const Point(7, 7), const Point(6, 7)]);
      _dir = const Point(1, 0);
      _score = 0;
    });
    _timer = Timer.periodic(const Duration(milliseconds: 120), (_) => _step());
  }

  void _step() {
    final head = Point(_snake.first.x + _dir.x, _snake.first.y + _dir.y);
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows || _snake.contains(head)) {
      _timer?.cancel();
      widget.onGameOver(_score, 'Length ${_snake.length}');
      return;
    }
    setState(() {
      _snake.insert(0, head);
      if (head == _orb) {
        _score += 100;
        _orb = Point(Random().nextInt(cols), Random().nextInt(rows));
      } else {
        _snake.removeLast();
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
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Score: $_score pts · Length: ${_snake.length}'),
            ElevatedButton(onPressed: _start, child: const Text('Start Cyber Snake')),
          ],
        ),
      ],
    );
  }
}
