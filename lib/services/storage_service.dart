import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/game_model.dart';

class StorageService {
  static const String _bestKey = 'cyber_arcade_best_scores';
  static const String _recentKey = 'cyber_arcade_recent_scores';
  static const String _soundKey = 'cyber_arcade_sound_enabled';

  SharedPreferences? _prefs;
  final Map<String, int> _bestScores = {};
  final List<ScoreRecord> _recentScores = [];
  bool _soundEnabled = true;

  Future<void> init() async {
    try {
      _prefs = await SharedPreferences.getInstance();
      _soundEnabled = _prefs?.getBool(_soundKey) ?? true;
      final bestRaw = _prefs?.getString(_bestKey);
      if (bestRaw != null) {
        final decoded = jsonDecode(bestRaw) as Map<String, dynamic>;
        decoded.forEach((k, v) => _bestScores[k] = (v as num).toInt());
      }
      final recentRaw = _prefs?.getStringList(_recentKey) ?? [];
      for (final item in recentRaw) {
        _recentScores.add(ScoreRecord.fromJson(jsonDecode(item) as Map<String, dynamic>));
      }
    } catch (_) {
      // Fallback to in-memory storage if browser storage is restricted
    }
  }

  bool get soundEnabled => _soundEnabled;

  int getBestScore(String gameId) => _bestScores[gameId] ?? 0;

  List<ScoreRecord> get recentScores => List.unmodifiable(_recentScores);

  Future<void> recordScore(String gameId, int score, String detail, {bool lowerIsBetter = false}) async {
    final currentBest = _bestScores[gameId] ?? 0;
    if (lowerIsBetter) {
      if (score > 0 && (currentBest == 0 || score < currentBest)) {
        _bestScores[gameId] = score;
      }
    } else if (score > currentBest) {
      _bestScores[gameId] = score;
    }

    _recentScores.insert(
      0,
      ScoreRecord(
        gameId: gameId,
        score: score,
        timestamp: DateTime.now(),
        detail: detail,
      ),
    );
    if (_recentScores.length > 40) {
      _recentScores.removeLast();
    }

    await _persist();
  }

  Future<void> setSoundEnabled(bool enabled) async {
    _soundEnabled = enabled;
    try {
      await _prefs?.setBool(_soundKey, enabled);
    } catch (_) {}
  }

  Future<void> clearAllRecords() async {
    _bestScores.clear();
    _recentScores.clear();
    try {
      await _prefs?.remove(_bestKey);
      await _prefs?.remove(_recentKey);
    } catch (_) {}
  }

  Future<void> _persist() async {
    try {
      await _prefs?.setString(_bestKey, jsonEncode(_bestScores));
      await _prefs?.setStringList(
        _recentKey,
        _recentScores.map((r) => jsonEncode(r.toJson())).toList(),
      );
    } catch (_) {}
  }
}
