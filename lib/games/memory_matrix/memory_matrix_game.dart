import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

class MemoryMatrixWidget extends StatefulWidget {
  final void Function(int score, String detail) onGameOver;

  const MemoryMatrixWidget({super.key, required this.onGameOver});

  @override
  State<MemoryMatrixWidget> createState() => _MemoryMatrixWidgetState();
}

class _MemoryMatrixWidgetState extends State<MemoryMatrixWidget> {
  final List<int> _sequence = [];
  int _step = 0;
  int _level = 1;
  int _score = 0;
  int? _activeTile;
  bool _acceptingInput = false;
  final Random _rng = Random();

  Future<void> _startGame() async {
    _sequence
      ..clear()
      ..addAll([_rng.nextInt(16), _rng.nextInt(16), _rng.nextInt(16)]);
    setState(() {
      _level = 1;
      _score = 0;
      _step = 0;
    });
    await _playSequence();
  }

  Future<void> _playSequence() async {
    setState(() {
      _acceptingInput = false;
      _step = 0;
    });
    await Future.delayed(const Duration(milliseconds: 400));
    for (final index in _sequence) {
      if (!mounted) return;
      setState(() => _activeTile = index);
      await Future.delayed(const Duration(milliseconds: 420));
      if (!mounted) return;
      setState(() => _activeTile = null);
      await Future.delayed(const Duration(milliseconds: 140));
    }
    if (mounted) setState(() => _acceptingInput = true);
  }

  void _onTileTap(int index) {
    if (!_acceptingInput) return;
    if (_sequence[_step] == index) {
      setState(() {
        _score += 25 + _level * 10;
        _step++;
      });
      if (_step >= _sequence.length) {
        _level++;
        _sequence.add(_rng.nextInt(16));
        _playSequence();
      }
    } else {
      setState(() => _acceptingInput = false);
      widget.onGameOver(_score, 'Reached Level $_level');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Level $_level · Score: $_score pts'),
            ElevatedButton(onPressed: _startGame, child: const Text('Start Matrix')),
          ],
        ),
        const SizedBox(height: 16),
        Expanded(
          child: GridView.builder(
            itemCount: 16,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemBuilder: (context, index) {
              final lit = _activeTile == index;
              return GestureDetector(
                onTap: () => _onTileTap(index),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  decoration: BoxDecoration(
                    color: lit ? const Color(0xFF22D3EE) : const Color(0xFF0E1525),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
