import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';

class NeonReflexWidget extends StatefulWidget {
  final void Function(int score, String detail) onGameOver;

  const NeonReflexWidget({super.key, required this.onGameOver});

  @override
  State<NeonReflexWidget> createState() => _NeonReflexWidgetState();
}

class _NeonReflexWidgetState extends State<NeonReflexWidget> {
  Timer? _waitTimer;
  final Stopwatch _stopwatch = Stopwatch();
  final List<int> _roundTimes = [];
  String _state = 'IDLE'; // IDLE, WAITING, SIGNAL, FALSE_START, DONE

  void _startRound() {
    _waitTimer?.cancel();
    _stopwatch.reset();
    setState(() => _state = 'WAITING');
    final delayMs = 1200 + Random().nextInt(2200);
    _waitTimer = Timer(Duration(milliseconds: delayMs), () {
      if (!mounted) return;
      setState(() => _state = 'SIGNAL');
      _stopwatch.start();
    });
  }

  void _handleTap() {
    if (_state == 'IDLE' || _state == 'DONE') {
      _roundTimes.clear();
      _startRound();
    } else if (_state == 'WAITING') {
      _waitTimer?.cancel();
      setState(() => _state = 'FALSE_START');
    } else if (_state == 'FALSE_START') {
      _startRound();
    } else if (_state == 'SIGNAL') {
      _stopwatch.stop();
      final ms = max(1, _stopwatch.elapsedMilliseconds);
      _roundTimes.add(ms);
      if (_roundTimes.length >= 5) {
        final avg = (_roundTimes.reduce((a, b) => a + b) / _roundTimes.length).round();
        final best = _roundTimes.reduce(min);
        setState(() => _state = 'DONE');
        widget.onGameOver(avg, 'Avg $avg ms · Best $best ms');
      } else {
        _startRound();
      }
    }
  }

  @override
  void dispose() {
    _waitTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _handleTap,
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: _state == 'SIGNAL'
              ? const Color(0xFF083344)
              : _state == 'WAITING'
                  ? const Color(0xFF451A03)
                  : const Color(0xFF0E1525),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF22D3EE)),
        ),
        child: Text(
          _state == 'SIGNAL'
              ? 'STRIKE NOW!'
              : _state == 'WAITING'
                  ? 'Wait for Cyan Signal...'
                  : _state == 'FALSE_START'
                      ? 'False Start! Tap to Retry Round'
                      : 'Tap to Start 5-Round Reflex Benchmark',
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
