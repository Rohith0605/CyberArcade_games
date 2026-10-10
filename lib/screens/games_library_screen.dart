import 'package:flutter/material.dart';
import '../models/game_model.dart';
import '../services/storage_service.dart';
import '../widgets/game_card.dart';

class GamesLibraryScreen extends StatefulWidget {
  final StorageService storage;
  final ValueChanged<GameInfo> onSelectGame;

  const GamesLibraryScreen({
    super.key,
    required this.storage,
    required this.onSelectGame,
  });

  @override
  State<GamesLibraryScreen> createState() => _GamesLibraryScreenState();
}

class _GamesLibraryScreenState extends State<GamesLibraryScreen> {
  String _searchQuery = '';
  String _selectedCategory = 'All';

  @override
  Widget build(BuildContext context) {
    final filtered = GameCatalog.allGames.where((g) {
      final matchesCat = _selectedCategory == 'All' || g.category == _selectedCategory;
      final matchesSearch = g.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          g.description.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    }).toList();

    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Games Library',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  onChanged: (v) => setState(() => _searchQuery = v),
                  decoration: const InputDecoration(
                    hintText: 'Search games by name or style...',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              DropdownButton<String>(
                value: _selectedCategory,
                items: const ['All', 'Action', 'Reflex', 'Puzzle', 'Arcade']
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (v) => setState(() => _selectedCategory = v ?? 'All'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 380,
                mainAxisExtent: 240,
                crossAxisSpacing: 20,
                mainAxisSpacing: 20,
              ),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final game = filtered[index];
                return GameCard(
                  game: game,
                  bestScore: widget.storage.getBestScore(game.id),
                  onPlay: () => widget.onSelectGame(game),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
