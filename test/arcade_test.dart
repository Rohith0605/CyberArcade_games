import 'package:flutter_test/flutter_test.dart';
import 'package:cyber_arcade/models/game_model.dart';
import 'package:cyber_arcade/services/storage_service.dart';

void main() {
  group('Cyber Arcade Unit Tests', () {
    test('GameCatalog contains all five required playable games', () {
      expect(GameCatalog.allGames.length, 5);
      final ids = GameCatalog.allGames.map((g) => g.id).toList();
      expect(ids, containsAll([
        'cyber_runner',
        'neon_reflex',
        'memory_matrix',
        'space_shooter',
        'cyber_snake',
      ]));
    });

    test('StorageService updates personal bests for standard and reflex games', () async {
      final storage = StorageService();
      await storage.recordScore('cyber_runner', 1200, '300m sprint');
      await storage.recordScore('cyber_runner', 850, '200m sprint');
      expect(storage.getBestScore('cyber_runner'), 1200);

      // Neon reflex uses lowerIsBetter (ms)
      await storage.recordScore('neon_reflex', 260, 'Avg 260ms', lowerIsBetter: true);
      await storage.recordScore('neon_reflex', 215, 'Avg 215ms', lowerIsBetter: true);
      expect(storage.getBestScore('neon_reflex'), 215);
    });
  });
}
