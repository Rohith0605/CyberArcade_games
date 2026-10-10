import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

const _bg = Color(0xFF070B18);
const _panel = Color(0xFF10182B);
const _cyan = Color(0xFF5CF6FF);
const _pink = Color(0xFFFF4FCB);
const _gold = Color(0xFFFFC857);

class _Bolt {
  double x, y;
  final double speed;
  _Bolt(this.x, this.y, this.speed);
}

class _Invader {
  double x, y, speed, phase;
  int hp;
  _Invader(this.x, this.y, this.speed, this.phase, this.hp);
}

class _Boss {
  double x, y, direction;
  int hp;
  _Boss(this.x, this.y, this.direction, this.hp);
}

class SpaceShooterWidget extends StatefulWidget {
  final void Function(int score, String detail) onGameOver;
  const SpaceShooterWidget({super.key, required this.onGameOver});

  @override
  State<SpaceShooterWidget> createState() => _SpaceShooterWidgetState();
}

class _SpaceShooterWidgetState extends State<SpaceShooterWidget> {
  final math.Random _rng = math.Random();
  final FocusNode _focus = FocusNode();
  Timer? _loop;
  final List<_Bolt> _shots = [];
  final List<_Invader> _enemies = [];
  final List<_Bolt> _enemyShots = [];
  double _w = 900, _h = 560;
  double _px = .5, _py = .82;
  double _bossX = .5;
  int _score = 0, _lives = 3, _level = 1, _kills = 0, _frame = 0;
  int _bossHp = 0, _bossMax = 0, _best = 0;
  bool _playing = false, _paused = false, _ended = false, _won = false;
  bool _left = false, _right = false, _up = false, _down = false;
  double _invulnerable = 0;
  String _message = 'READY, PILOT';
  int _messageTicks = 0;

  int get _targetKills => 8 + (_level - 1) * 2;
  bool get _bossActive => _bossHp > 0;

  @override
  void dispose() {
    _loop?.cancel();
    _focus.dispose();
    super.dispose();
  }

  void _start() {
    _loop?.cancel();
    setState(() {
      _score = 0;
      _lives = 3;
      _level = 1;
      _kills = 0;
      _frame = 0;
      _px = .5;
      _py = .82;
      _bossX = .5;
      _bossHp = 0;
      _bossMax = 0;
      _invulnerable = 0;
      _shots.clear();
      _enemies.clear();
      _enemyShots.clear();
      _playing = true;
      _paused = false;
      _ended = false;
      _won = false;
      _message = 'SECTOR 01 // ENGAGE';
      _messageTicks = 100;
    });
    _focus.requestFocus();
    _loop = Timer.periodic(const Duration(milliseconds: 16), (_) => _tick());
  }

  void _nextLevel() {
    _level++;
    _kills = 0;
    _shots.clear();
    _enemies.clear();
    _enemyShots.clear();
    _bossHp = 0;
    _bossMax = 0;
    _px = .5;
    _py = .82;
    _invulnerable = 2.0;
    _message = _level == 5 ? 'FINAL SECTOR // TITAN' : 'SECTOR 0$_level // INCOMING';
    _messageTicks = 115;
  }

  void _endGame({required bool victory}) {
    _playing = false;
    _paused = false;
    _ended = true;
    _won = victory;
    _loop?.cancel();
    _best = math.max(_best, _score);
    widget.onGameOver(_score, victory ? 'Victory · All 5 sectors cleared' : 'Sector $_level · $_kills hostiles destroyed');
  }

  void _tick() {
    if (!mounted || !_playing || _paused) return;
    const dt = 1 / 60;
    _frame++;
    if (_messageTicks > 0) _messageTicks--;
    if (_invulnerable > 0) _invulnerable -= dt;

    final move = .010 + _level * .0007;
    if (_left) _px -= move;
    if (_right) _px += move;
    if (_up) _py -= move;
    if (_down) _py += move;
    _px = _px.clamp(.035, .965).toDouble();
    _py = _py.clamp(.12, .91).toDouble();

    // Smart auto-fire keeps the action flowing on touch screens.
    if (_frame % math.max(7, 12 - _level) == 0) {
      _shots.add(_Bolt(_px * _w, _py * _h - 20, 9.5 + _level * .4));
    }

    if (!_bossActive && _kills < _targetKills &&
        _frame % math.max(23, 52 - _level * 4) == 0) {
      final x = .07 + _rng.nextDouble() * .86;
      _enemies.add(_Invader(x * _w, -28, (1.6 + _level * .42), _rng.nextDouble() * 6.28, _level >= 3 ? 2 : 1));
    }

    // Spawn the sector boss after clearing the enemy wave.
    if (!_bossActive && _kills >= _targetKills && _enemies.isEmpty) {
      _bossMax = 12 + _level * 5;
      _bossHp = _bossMax;
      _bossX = .5;
      _message = 'WARNING // SECTOR BOSS';
      _messageTicks = 100;
    }

    for (final s in _shots) { s.y -= s.speed; }
    _shots.removeWhere((s) => s.y < -24);
    for (final e in _enemies) {
      e.y += e.speed;
      e.x += math.sin(_frame * .045 + e.phase) * (1.0 + _level * .12);
    }
    for (final s in _enemyShots) { s.y += s.speed; }
    _enemyShots.removeWhere((s) => s.y > _h + 30);

    // Boss movement and aimed bursts.
    if (_bossActive) {
      _bossX += math.sin(_frame * .027) * (.0016 + _level * .00015);
      _bossX = _bossX.clamp(.19, .81).toDouble();
      if (_frame % math.max(28, 58 - _level * 5) == 0) {
        _enemyShots.add(_Bolt(_bossX * _w, .19 * _h, 3.2 + _level * .45));
        if (_level >= 3) {
          _enemyShots.add(_Bolt((_bossX - .08) * _w, .19 * _h, 3.4 + _level * .4));
          _enemyShots.add(_Bolt((_bossX + .08) * _w, .19 * _h, 3.4 + _level * .4));
        }
      }
    }

    // Player bolts collide with ordinary enemies.
    for (final s in List<_Bolt>.from(_shots)) {
      var hit = false;
      for (final e in List<_Invader>.from(_enemies)) {
        if ((s.x - e.x).abs() < 19 && (s.y - e.y).abs() < 20) {
          _shots.remove(s);
          e.hp--;
          hit = true;
          if (e.hp <= 0) {
            _enemies.remove(e);
            _kills++;
            _score += 100 * _level;
          }
          break;
        }
      }
      if (hit) continue;
      if (_bossActive && (s.x - _bossX * _w).abs() < _w * .13 &&
          (s.y - .17 * _h).abs() < 34) {
        _shots.remove(s);
        _bossHp--;
        _score += 20 * _level;
        if (_bossHp <= 0) {
          _score += 500 * _level;
          if (_level == 5) {
            _endGame(victory: true);
            if (mounted) setState(() {});
            return;
          }
          _nextLevel();
          break;
        }
      }
    }

    final playerX = _px * _w;
    final playerY = _py * _h;
    for (final e in List<_Invader>.from(_enemies)) {
      if ((e.x - playerX).abs() < 24 && (e.y - playerY).abs() < 25) {
        _enemies.remove(e);
        if (_invulnerable <= 0) {
          _lives--;
          _invulnerable = 1.5;
        }
      } else if (e.y > _h + 25) {
        _enemies.remove(e);
      }
    }
    for (final s in List<_Bolt>.from(_enemyShots)) {
      if ((s.x - playerX).abs() < 19 && (s.y - playerY).abs() < 20) {
        _enemyShots.remove(s);
        if (_invulnerable <= 0) {
          _lives--;
          _invulnerable = 1.5;
        }
      }
    }
    if (_lives <= 0) {
      _endGame(victory: false);
    }
    if (mounted) setState(() {});
  }

  void _onKey(RawKeyEvent event) {
    final down = event is RawKeyDownEvent;
    final key = event.logicalKey;
    if (key == LogicalKeyboardKey.arrowLeft || key == LogicalKeyboardKey.keyA) _left = down;
    if (key == LogicalKeyboardKey.arrowRight || key == LogicalKeyboardKey.keyD) _right = down;
    if (key == LogicalKeyboardKey.arrowUp || key == LogicalKeyboardKey.keyW) _up = down;
    if (key == LogicalKeyboardKey.arrowDown || key == LogicalKeyboardKey.keyS) _down = down;
    if (key == LogicalKeyboardKey.space && down && !_playing) _start();
    if (key == LogicalKeyboardKey.escape && down && _playing) setState(() => _paused = !_paused);
  }

  void _drag(DragUpdateDetails d) {
    setState(() {
      _px = (_px + d.delta.dx / _w).clamp(.035, .965).toDouble();
      _py = (_py + d.delta.dy / _h).clamp(.12, .91).toDouble();
    });
  }

  void _nudge(double dx, double dy) {
    setState(() {
      _px = (_px + dx).clamp(.035, .965).toDouble();
      _py = (_py + dy).clamp(.12, .91).toDouble();
    });
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      _w = constraints.maxWidth.isFinite ? constraints.maxWidth : 900;
      _h = constraints.maxHeight.isFinite ? constraints.maxHeight : 560;
      return RawKeyboardListener(
        focusNode: _focus,
        onKey: _onKey,
        autofocus: true,
        child: Container(
          decoration: BoxDecoration(
            color: _bg,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFF273753)),
            boxShadow: const [BoxShadow(color: Color(0x3326D9FF), blurRadius: 28, spreadRadius: -12)],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(children: [
            Positioned.fill(
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onPanUpdate: _drag,
                onTap: () { if (!_playing) _start(); },
                child: CustomPaint(
                  painter: _GalaxyPainter(
                    px: _px * _w, py: _py * _h, shots: _shots,
                    enemies: _enemies, enemyShots: _enemyShots,
                    bossX: _bossX * _w, bossHp: _bossHp, bossMax: _bossMax,
                    frame: _frame, invulnerable: _invulnerable > 0,
                  ),
                ),
              ),
            ),
            Positioned(left: 14, right: 14, top: 14, child: _topHud()),
            if (_messageTicks > 0 && _playing && !_paused)
              Positioned(top: 82, left: 12, right: 12, child: IgnorePointer(
                child: Center(child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(color: const Color(0xDD10182B), borderRadius: BorderRadius.circular(9),
                    border: Border.all(color: _message.contains('BOSS') ? _pink : _cyan)),
                  child: Text(_message, textAlign: TextAlign.center,
                    style: TextStyle(color: _message.contains('BOSS') ? _pink : _cyan, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 2)),
                )),
              )),
            if (!_playing || _paused) Positioned.fill(child: _overlay()),
            if (_playing && !_paused)
              Positioned(left: 12, right: 12, bottom: 12, child: _touchControls()),
          ]),
        ),
      );
    });
  }

  Widget _topHud() => Row(children: [
    _stat('SCORE', '$_score'),
    const SizedBox(width: 8),
    _stat('SECTOR', '$_level / 5'),
    const SizedBox(width: 8),
    _stat('HULL', '♥ $_lives'),
    const Spacer(),
    if (_bossActive)
      Expanded(flex: 2, child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('BOSS CORE', style: TextStyle(color: _pink, fontSize: 9, letterSpacing: 1.5, fontWeight: FontWeight.bold)),
          const SizedBox(height: 5),
          ClipRRect(borderRadius: BorderRadius.circular(8), child: LinearProgressIndicator(
            value: _bossMax == 0 ? 0 : (_bossHp / _bossMax).clamp(0, 1).toDouble(),
            minHeight: 7, backgroundColor: const Color(0xFF3A1A3A), color: _pink)),
        ]),
      )),
    IconButton(
      tooltip: _paused ? 'Resume' : 'Pause',
      onPressed: _playing ? () => setState(() => _paused = !_paused) : null,
      icon: Icon(_paused ? Icons.play_arrow_rounded : Icons.pause_rounded, color: _cyan),
    ),
  ]);

  Widget _stat(String label, String value) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
    decoration: BoxDecoration(color: const Color(0xE610182B), borderRadius: BorderRadius.circular(10),
      border: Border.all(color: const Color(0xFF293954))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
      Text(label, style: const TextStyle(fontSize: 8, color: Color(0xFF8EA1C2), letterSpacing: 1.4, fontWeight: FontWeight.w700)),
      const SizedBox(height: 3),
      Text(value, style: const TextStyle(fontSize: 13, color: _cyan, fontWeight: FontWeight.w900)),
    ]),
  );

  Widget _overlay() => Container(
    color: const Color(0xD9070B18),
    child: Center(child: SingleChildScrollView(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 450),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 74, height: 74,
              decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0x2226D9FF),
                border: Border.all(color: _won ? _gold : _cyan, width: 1.5),
                boxShadow: [BoxShadow(color: (_won ? _gold : _cyan).withOpacity(.22), blurRadius: 24)]),
              child: Icon(_paused ? Icons.pause_rounded : _won ? Icons.emoji_events_rounded : _ended ? Icons.broken_image_outlined : Icons.rocket_launch_rounded,
                color: _won ? _gold : _cyan, size: 36),
            ),
            const SizedBox(height: 18),
            Text(
              _paused ? 'MISSION PAUSED' : _won ? 'GALAXY SAVED' : _ended ? 'MISSION FAILED' : 'STARFALL: ZERO HOUR',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 25, fontWeight: FontWeight.w900, letterSpacing: 1.7),
            ),
            const SizedBox(height: 10),
            Text(
              _paused ? 'Your ship is holding position. Resume when ready.' :
              _won ? 'All five sectors cleared. The galaxy owes you one.' :
              _ended ? 'You reached sector $_level. Score: $_score. The fleet is not done with you yet.' :
              'A next-gen arcade shooter. Clear each enemy wave, destroy its boss, and survive all five sectors.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF9DADC8), height: 1.55, fontSize: 13),
            ),
            if (!_paused && !_ended) ...[
              const SizedBox(height: 18),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) => Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: 32, height: 5,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  color: i == 0 ? _cyan : const Color(0xFF27334B),
                ),
              ))),
              const SizedBox(height: 8),
              const Text('5 SECTORS  •  5 BOSSES  •  ONE SHIP',
                style: TextStyle(color: _cyan, fontSize: 10, letterSpacing: 1.4, fontWeight: FontWeight.bold)),
            ],
            if (_ended) ...[
              const SizedBox(height: 16),
              Text('FINAL SCORE  $_score     •     BEST  $_best',
                style: const TextStyle(color: _gold, fontSize: 12, fontWeight: FontWeight.w800)),
            ],
            const SizedBox(height: 22),
            SizedBox(width: 220, height: 48, child: FilledButton.icon(
              onPressed: _paused ? () => setState(() => _paused = false) : _start,
              icon: Icon(_paused ? Icons.play_arrow_rounded : _ended ? Icons.refresh_rounded : Icons.bolt_rounded),
              label: Text(_paused ? 'RESUME MISSION' : _ended ? 'PLAY AGAIN' : 'LAUNCH MISSION'),
              style: FilledButton.styleFrom(backgroundColor: _won ? _gold : _cyan,
                foregroundColor: const Color(0xFF07101D),
                textStyle: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: .7)),
            )),
            const SizedBox(height: 12),
            const Text('MOVE: WASD / ARROWS / TOUCH DRAG     •     PAUSE: ESC',
              textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF6E809F), fontSize: 9, letterSpacing: .5)),
          ]),
        ),
      ),
    )),
  );

  Widget _touchControls() => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Row(children: [
        _pad(Icons.chevron_left_rounded, () => _nudge(-.055, 0)),
        const SizedBox(width: 6),
        Column(mainAxisSize: MainAxisSize.min, children: [
          _pad(Icons.keyboard_arrow_up_rounded, () => _nudge(0, -.055)),
          const SizedBox(height: 6),
          _pad(Icons.keyboard_arrow_down_rounded, () => _nudge(0, .055)),
        ]),
        const SizedBox(width: 6),
        _pad(Icons.chevron_right_rounded, () => _nudge(.055, 0)),
      ]),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(color: const Color(0xDD10182B), borderRadius: BorderRadius.circular(9),
          border: Border.all(color: const Color(0xFF293954))),
        child: const Row(children: [
          Icon(Icons.bolt_rounded, color: _pink, size: 15),
          SizedBox(width: 5),
          Text('AUTO FIRE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
        ]),
      ),
    ],
  );

  Widget _pad(IconData icon, VoidCallback action) => Material(
    color: const Color(0xDD10182B), borderRadius: BorderRadius.circular(10),
    child: InkWell(onTap: action, borderRadius: BorderRadius.circular(10),
      child: SizedBox(width: 38, height: 38, child: Icon(icon, color: _cyan, size: 24))),
  );
}

class _GalaxyPainter extends CustomPainter {
  final double px, py, bossX;
  final List<_Bolt> shots, enemyShots;
  final List<_Invader> enemies;
  final int bossHp, bossMax, frame;
  final bool invulnerable;

  _GalaxyPainter({
    required this.px, required this.py, required this.shots,
    required this.enemies, required this.enemyShots, required this.bossX,
    required this.bossHp, required this.bossMax, required this.frame,
    required this.invulnerable,
  });

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..shader = const LinearGradient(
      begin: Alignment.topCenter, end: Alignment.bottomCenter,
      colors: [Color(0xFF080D20), Color(0xFF10132A), Color(0xFF070B18)],
    ).createShader(Offset.zero & size));

    // Subtle perspective grid and moving starfield.
    final grid = Paint()..color = const Color(0xFF172443).withOpacity(.55)..strokeWidth = .65;
    for (double x = 0; x < size.width; x += 42) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), grid);
    }
    for (double y = 0; y < size.height; y += 42) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }
    for (int i = 0; i < 85; i++) {
      final x = (i * 113.0 + (i % 7) * 13) % size.width;
      final y = (i * 71.0 + frame * (i % 3 + 1) * .65) % size.height;
      final radius = i % 9 == 0 ? 1.6 : .7;
      canvas.drawCircle(Offset(x, y), radius,
        Paint()..color = (i % 4 == 0 ? _pink : const Color(0xFF9BE9FF)).withOpacity(i % 5 == 0 ? .9 : .42));
    }

    // Player ship: layered neon hull and engine exhaust.
    if (!invulnerable || frame % 8 < 4) {
      final engine = Path()
        ..moveTo(px - 5, py + 8)..lineTo(px, py + 25 + (frame % 5) * 1.5)..lineTo(px + 5, py + 8)..close();
      canvas.drawPath(engine, Paint()..color = _pink.withOpacity(.8));
      canvas.drawCircle(Offset(px, py + 13), 11,
        Paint()..color = _cyan.withOpacity(.18)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10));
      final ship = Path()
        ..moveTo(px, py - 21)..lineTo(px - 17, py + 13)..lineTo(px - 5, py + 9)
        ..lineTo(px, py + 14)..lineTo(px + 5, py + 9)..lineTo(px + 17, py + 13)..close();
      canvas.drawPath(ship, Paint()..color = _cyan);
      canvas.drawPath(ship, Paint()..style = PaintingStyle.stroke..strokeWidth = 1.4..color = Colors.white);
      canvas.drawCircle(Offset(px, py + 1), 3.2, Paint()..color = const Color(0xFF17334B));
    }

    final shotPaint = Paint()..strokeWidth = 3.5..strokeCap = StrokeCap.round;
    for (final s in shots) {
      shotPaint.color = _cyan.withOpacity(.35);
      canvas.drawLine(Offset(s.x, s.y + 9), Offset(s.x, s.y - 9), shotPaint..strokeWidth = 7);
      shotPaint.color = Colors.white;
      canvas.drawLine(Offset(s.x, s.y + 8), Offset(s.x, s.y - 8), shotPaint..strokeWidth = 2);
    }
    for (final s in enemyShots) {
      canvas.drawCircle(Offset(s.x, s.y), 9, Paint()..color = _pink.withOpacity(.2));
      canvas.drawCircle(Offset(s.x, s.y), 4, Paint()..color = _pink);
    }

    for (final e in enemies) {
      final center = Offset(e.x, e.y);
      final glow = Paint()..color = (e.hp > 1 ? _gold : _pink).withOpacity(.18)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 9);
      canvas.drawCircle(center, 18, glow);
      final path = Path()..moveTo(e.x, e.y + 15)..lineTo(e.x - 17, e.y - 9)
        ..lineTo(e.x - 5, e.y - 5)..lineTo(e.x, e.y - 13)
        ..lineTo(e.x + 5, e.y - 5)..lineTo(e.x + 17, e.y - 9)..close();
      canvas.drawPath(path, Paint()..color = e.hp > 1 ? _gold : _pink);
      canvas.drawPath(path, Paint()..style = PaintingStyle.stroke..strokeWidth = 1.2..color = Colors.white.withOpacity(.85));
    }

    if (bossHp > 0) {
      final by = size.height * .18;
      final glow = Paint()..color = _pink.withOpacity(.25)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 22);
      canvas.drawCircle(Offset(bossX, by), 54, glow);
      final boss = Path()..moveTo(bossX, by - 34)..lineTo(bossX - 48, by - 5)
        ..lineTo(bossX - 39, by + 26)..lineTo(bossX - 12, by + 17)
        ..lineTo(bossX, by + 31)..lineTo(bossX + 12, by + 17)
        ..lineTo(bossX + 39, by + 26)..lineTo(bossX + 48, by - 5)..close();
      canvas.drawPath(boss, Paint()..shader = const LinearGradient(
        colors: [Color(0xFFFF4FCB), Color(0xFF6A35D4)],
        begin: Alignment.topLeft, end: Alignment.bottomRight,
      ).createShader(Rect.fromCenter(center: Offset(bossX, by), width: 100, height: 70)));
      canvas.drawPath(boss, Paint()..style = PaintingStyle.stroke..strokeWidth = 2..color = const Color(0xFFFFB8EF));
      canvas.drawCircle(Offset(bossX, by + 2), 10, Paint()..color = const Color(0xFFFFC4F3));
      canvas.drawCircle(Offset(bossX, by + 2), 5, Paint()..color = const Color(0xFF25113F));
    }
  }

  @override
  bool shouldRepaint(covariant _GalaxyPainter oldDelegate) => true;
}
