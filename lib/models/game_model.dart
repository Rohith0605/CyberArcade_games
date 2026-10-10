class GameInfo {
  final String id;
  final String title;
  final String category;
  final String difficulty;
  final String scoreUnit;
  final bool lowerIsBetter;
  final String description;
  final String desktopControls;
  final String mobileControls;

  const GameInfo({
    required this.id,
    required this.title,
    required this.category,
    required this.difficulty,
    required this.scoreUnit,
    this.lowerIsBetter = false,
    required this.description,
    required this.desktopControls,
    required this.mobileControls,
  });
}

class ScoreRecord {
  final String gameId;
  final int score;
  final DateTime timestamp;
  final String detail;

  const ScoreRecord({
    required this.gameId,
    required this.score,
    required this.timestamp,
    required this.detail,
  });

  Map<String, dynamic> toJson() => {
        'gameId': gameId,
        'score': score,
        'timestamp': timestamp.toIso8601String(),
        'detail': detail,
      };

  factory ScoreRecord.fromJson(Map<String, dynamic> json) => ScoreRecord(
        gameId: json['gameId'] as String,
        score: json['score'] as int,
        timestamp: DateTime.parse(json['timestamp'] as String),
        detail: json['detail'] as String? ?? '',
      );
}

class GameCatalog {
  static const List<GameInfo> allGames = [
    GameInfo(
      id: 'cyber_runner',
      title: 'Cyber Runner',
      category: 'Action',
      difficulty: 'Moderate',
      scoreUnit: 'pts',
      description: 'Endless rooftop sprint across a neon highway with double-jump and slide mechanics.',
      desktopControls: 'Space / Up Arrow to Jump · Down Arrow to Slide',
      mobileControls: 'Tap Jump or Slide touch controls',
    ),
    GameInfo(
      id: 'neon_reflex',
      title: 'Neon Reflex',
      category: 'Reflex',
      difficulty: 'Accessible',
      scoreUnit: 'ms',
      lowerIsBetter: true,
      description: 'Five-round reaction benchmark measuring neural response speed in milliseconds.',
      desktopControls: 'Mouse Click or Spacebar when chamber turns Cyan',
      mobileControls: 'Tap reaction chamber on Cyan signal',
    ),
    GameInfo(
      id: 'memory_matrix',
      title: 'Memory Matrix',
      category: 'Puzzle',
      difficulty: 'Moderate',
      scoreUnit: 'pts',
      description: 'Sequential pattern memory puzzle on a 4x4 quantum tile matrix.',
      desktopControls: 'Click tiles or use Arrow Keys + Spacebar',
      mobileControls: 'Tap tiles in sequence order',
    ),
    GameInfo(
      id: 'space_shooter',
      title: 'Space Shooter',
      category: 'Action',
      difficulty: 'Challenging',
      scoreUnit: 'pts',
      description: 'Arcade starfighter survival shooter powered by Flame collision and particle loops.',
      desktopControls: 'WASD / Arrow Keys to Move · Spacebar to Shoot',
      mobileControls: 'Touch directional pad and Fire button',
    ),
    GameInfo(
      id: 'cyber_snake',
      title: 'Cyber Snake',
      category: 'Arcade',
      difficulty: 'Accessible',
      scoreUnit: 'pts',
      description: 'Classic grid serpent arcade game with magenta energy orbs and golden overdrive nodes.',
      desktopControls: 'Arrow Keys or WASD to Steer · P to Pause',
      mobileControls: 'On-screen directional buttons or swipe gestures',
    ),
  ];
}
