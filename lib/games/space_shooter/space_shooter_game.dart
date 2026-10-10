import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class _Shot {
  double x, y;
  final double speed;
  _Shot(this.x, this.y, this.speed);
}

class _Enemy {
  double x, y, speed, phase;
  int hp;
  _Enemy(this.x, this.y, this.speed, this.phase, this.hp);
}

class SpaceShooterWidget extends StatefulWidget {
  final void Function(int score, String detail) onGameOver;
  const SpaceShooterWidget({super.key, required this.onGameOver});

  @override
  State<SpaceShooterWidget> createState() => _SpaceShooterWidgetState();
}

class _SpaceShooterWidgetState extends State<SpaceShooterWidget>
    with SingleTickerProviderStateMixin {
  final _random = math.Random();
  final _focus = FocusNode();
  Timer? _timer;
  final List<_Shot> _shots = [];
  final List<_Enemy> _enemies = [];
  double _playerX = 0.5, _playerY = 0.82;
  double _width = 800, _height = 520;
  int _score = 0, _kills = 0, _level = 1, _lives = 3, _best = 0;
  bool _playing = false, _ended = false, _paused = false;
  bool _left = false, _right = false, _up = false, _down = false, _fire = false;
  int _frame = 0;

  @override
  void dispose() {
    _timer?.cancel();
    _focus.dispose();
    super.dispose();
  }

  void _start() {
    _timer?.cancel();
    setState(() {
      _score = 0; _kills = 0; _level = 1; _lives = 3; _frame = 0;
      _playerX = 0.5; _playerY = 0.82;
      _shots.clear(); _enemies.clear();
      _playing = true; _ended = false; _paused = false;
    });
    _focus.requestFocus();
    _timer = Timer.periodic(const Duration(milliseconds: 33), (_) => _tick());
  }

  void _tick() {
    if (!mounted || !_playing || _paused) return;
    _frame++;
    final speed = 0.008 + _level * 0.0012;
    if (_left) _playerX -= 0.012;
    if (_right) _playerX += 0.012;
    if (_up) _playerY -= 0.012;
    if (_down) _playerY += 0.012;
    _playerX = _playerX.clamp(0.035, 0.965);
    _playerY = _playerY.clamp(0.10, 0.91);

    if (_frame % math.max(8, 31 - _level * 2) == 0) {
      _shots.add(_Shot(_playerX * _width, _playerY * _height - 20, 8 + _level * .2));
    }
    if (_frame % math.max(14, 52 - _level * 3) == 0) {
      final x = .06 + _random.nextDouble() * .88;
      _enemies.add(_Enemy(x * _width, -25, speed * _height, _random.nextDouble() * 6.28, _level >= 5 ? 2 : 1));
    }

    for (final shot in _shots) { shot.y -= shot.speed; }
    _shots.removeWhere((s) => s.y < -20);
    for (final e in _enemies) {
      e.y += e.speed;
      e.x += math.sin(_frame * .045 + e.phase) * (1.1 + _level * .15);
    }
    for (final shot in List<_Shot>.from(_shots)) {
      for (final enemy in List<_Enemy>.from(_enemies)) {
        if ((shot.x - enemy.x).abs() < 17 && (shot.y - enemy.y).abs() < 20) {
          _shots.remove(shot);
          enemy.hp--;
          if (enemy.hp <= 0) {
            _enemies.remove(enemy); _kills++; _score += 100 * _level;
            if (_kills % 12 == 0) _level++;
          }
          break;
        }
      }
    }
    for (final enemy in List<_Enemy>.from(_enemies)) {
      if ((enemy.x - _playerX * _width).abs() < 25 &&
          (enemy.y - _playerY * _height).abs() < 25) {
        _enemies.remove(enemy); _lives--;
      } else if (enemy.y > _height + 20) {
        _enemies.remove(enemy);
      }
    }
    if (_lives <= 0) {
      _playing = false; _ended = true; _timer?.cancel();
      _best = math.max(_best, _score);
      widget.onGameOver(_score, 'Level $_level · $_kills enemies destroyed');
    }
    if (mounted) setState(() {});
  }

  void _key(RawKeyEvent event) {
    final down = event is RawKeyDownEvent;
    final key = event.logicalKey;
    if (key == LogicalKeyboardKey.arrowLeft || key == LogicalKeyboardKey.keyA) _left = down;
    if (key == LogicalKeyboardKey.arrowRight || key == LogicalKeyboardKey.keyD) _right = down;
    if (key == LogicalKeyboardKey.arrowUp || key == LogicalKeyboardKey.keyW) _up = down;
    if (key == LogicalKeyboardKey.arrowDown || key == LogicalKeyboardKey.keyS) _down = down;
    if (key == LogicalKeyboardKey.space && down && !_playing) _start();
    if (key == LogicalKeyboardKey.escape && down && _playing) setState(() => _paused = !_paused);
  }

  void _movePlayer(DragUpdateDetails d) {
    if (_width <= 0 || _height <= 0) return;
    setState(() {
      _playerX = (_playerX + d.delta.dx / _width).clamp(.035, .965);
      _playerY = (_playerY + d.delta.dy / _height).clamp(.1, .91);
    });
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      _width = constraints.maxWidth.isFinite ? constraints.maxWidth : 800;
      _height = constraints.maxHeight.isFinite ? constraints.maxHeight : 520;
      return RawKeyboardListener(
        focusNode: _focus,
        onKey: _key,
        autofocus: true,
        child: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF050816),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF24324E)),
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(children: [
            Positioned.fill(child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onPanUpdate: _movePlayer,
              onTap: () { if (!_playing) _start(); },
              child: CustomPaint(painter: _ShooterPainter(
                playerX: _playerX * _width, playerY: _playerY * _height,
                shots: _shots, enemies: _enemies, frame: _frame,
              )),
            )),
            Positioned(left: 18, right: 18, top: 16, child: Row(
              children: [
                _hud('SCORE', '$_score'),
                const SizedBox(width: 10),
                _hud('SECTOR', '$_level / 10'),
                const SizedBox(width: 10),
                _hud('HULL', '♥ ' * _lives),
                const Spacer(),
                IconButton(
                  tooltip: _paused ? 'Resume' : 'Pause',
                  onPressed: _playing ? () => setState(() => _paused = !_paused) : null,
                  icon: Icon(_paused ? Icons.play_arrow_rounded : Icons.pause_rounded, color: Colors.cyanAccent),
                ),
              ],
            )),
            if (!_playing || _paused)
              Positioned.fill(child: Container(
                color: const Color(0xCC050816),
                child: Center(child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(_ended ? Icons.rocket_launch_rounded : Icons.blur_on_rounded,
                        size: 54, color: const Color(0xFF22D3EE)),
                      const SizedBox(height: 12),
                      Text(_paused ? 'MISSION PAUSED' : _ended ? 'SHIP DESTROYED' : 'NEON FRONTIER',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 2)),
                      const SizedBox(height: 10),
                      Text(_paused ? 'Catch your breath. The enemy fleet is waiting.' :
                        _ended ? 'Score $_score  •  Sector $_level  •  Best $_best' :
                        'Survive the waves. Every 12 takedowns unlocks the next sector.',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Color(0xFF9FB2D4), height: 1.5)),
                      const SizedBox(height: 20),
                      FilledButton.icon(
                        onPressed: _paused ? () => setState(() => _paused = false) : _start,
                        icon: Icon(_paused ? Icons.play_arrow : Icons.rocket_launch),
                        label: Text(_paused ? 'RESUME MISSION' : _ended ? 'RETRY MISSION' : 'START MISSION'),
                        style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFF22D3EE), foregroundColor: const Color(0xFF06101D),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                        ),
                      ),
                    ]),
                  ),
                )),
              )),
            if (_playing)
              Positioned(bottom: 14, left: 14, right: 14, child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _control(Icons.arrow_left_rounded, () => setState(() => _playerX = (_playerX - .06).clamp(.035, .965))),
                  _control(Icons.arrow_upward_rounded, () => setState(() => _playerY = (_playerY - .06).clamp(.1, .91))),
                  _control(Icons.arrow_downward_rounded, () => setState(() => _playerY = (_playerY + .06).clamp(.1, .91))),
                  _control(Icons.arrow_right_rounded, () => setState(() => _playerX = (_playerX + .06).clamp(.035, .965))),
                  const SizedBox(width: 10),
                  FilledButton.icon(
                    onPressed: () => setState(() => _shots.add(_Shot(_playerX * _width, _playerY * _height - 20, 10))),
                    icon: const Icon(Icons.flash_on_rounded),
                    label: const Text('FIRE'),
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFFFF3CAC), foregroundColor: Colors.white),
                  ),
                ],
              )),
          ]),
        ),
      );
    });
  }

  Widget _hud(String label, String value) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(color: const Color(0xCC101A30), borderRadius: BorderRadius.circular(10),
      border: Border.all(color: const Color(0xFF263858))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
      Text(label, style: const TextStyle(fontSize: 9, color: Color(0xFF8295B8), letterSpacing: 1.5)),
      const SizedBox(height: 2),
      Text(value, style: const TextStyle(fontSize: 14, color: Color(0xFF67F7FF), fontWeight: FontWeight.w800)),
    ]),
  );

  Widget _control(IconData icon, VoidCallback action) => Material(
    color: const Color(0xCC101A30), borderRadius: BorderRadius.circular(12),
    child: InkWell(onTap: action, borderRadius: BorderRadius.circular(12),
      child: SizedBox(width: 42, height: 42, child: Icon(icon, color: Colors.cyanAccent))),
  );
}

class _ShooterPainter extends CustomPainter {
  final double playerX, playerY;
  final List<_Shot> shots;
  final List<_Enemy> enemies;
  final int frame;
  _ShooterPainter({required this.playerX, required this.playerY, required this.shots, required this.enemies, required this.frame});

  @override
  void paint(Canvas canvas, Size size) {
    final bg = Paint()..color = const Color(0xFF050816);
    canvas.drawRect(Offset.zero & size, bg);
    final grid = Paint()..color = const Color(0xFF12213A)..strokeWidth = .6;
    for (double x = 0; x < size.width; x += 36) canvas.drawLine(Offset(x, 0), Offset(x, size.height), grid);
    for (double y = 0; y < size.height; y += 36) canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    final stars = Paint()..color = const Color(0xFF8BDFFF);
    for (int i = 0; i < 48; i++) {
      final x = (i * 97.0) % size.width;
      final y = ((i * 67.0 + frame * (1 + i % 3)) % size.height);
      canvas.drawCircle(Offset(x, y), i % 5 == 0 ? 1.5 : .7, stars);
    }
    final glow = Paint()..color = const Color(0xFF22D3EE).withOpacity(.18)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 14);
    canvas.drawCircle(Offset(playerX, playerY), 22, glow);
    final ship = Path()..moveTo(playerX, playerY - 20)..lineTo(playerX - 15, playerY + 14)..lineTo(playerX, playerY + 7)..lineTo(playerX + 15, playerY + 14)..close();
    canvas.drawPath(ship, Paint()..color = const Color(0xFF22D3EE));
    canvas.drawPath(ship, Paint()..style = PaintingStyle.stroke..strokeWidth = 1.5..color = Colors.white);
    final shotPaint = Paint()..color = const Color(0xFFFF4BD8)..strokeWidth = 4..strokeCap = StrokeCap.round;
    for (final s in shots) {
      canvas.drawLine(Offset(s.x, s.y + 7), Offset(s.x, s.y - 7), shotPaint);
    }
    for (final e in enemies) {
      final p = Path()..moveTo(e.x, e.y + 15)..lineTo(e.x - 15, e.y - 10)..lineTo(e.x, e.y - 4)..lineTo(e.x + 15, e.y - 10)..close();
      canvas.drawPath(p, Paint()..color = e.hp > 1 ? const Color(0xFFFFB547) : const Color(0xFFFF3CAC));
      canvas.drawPath(p, Paint()..style = PaintingStyle.stroke..strokeWidth = 1.2..color = Colors.white.withOpacity(.8));
    }
  }

  @override
  bool shouldRepaint(covariant _ShooterPainter oldDelegate) => true;
}
