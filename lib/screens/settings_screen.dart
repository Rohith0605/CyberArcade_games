import 'package:flutter/material.dart';
import '../services/storage_service.dart';

class SettingsScreen extends StatelessWidget {
  final StorageService storage;
  final VoidCallback onChanged;

  const SettingsScreen({
    super.key,
    required this.storage,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Arcade Settings',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 24),
          SwitchListTile(
            title: const Text('Synthesized Arcade Sound Effects'),
            subtitle: const Text('Enable audio cues for jumps, lasers, and score milestones.'),
            value: storage.soundEnabled,
            onChanged: (val) async {
              await storage.setSoundEnabled(val);
              onChanged();
            },
          ),
          const Divider(height: 36),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Reset All Local Records?'),
                  content: const Text(
                    'This will permanently clear all personal bests and recent game sessions saved in this browser.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('Cancel'),
                    ),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('Reset Records'),
                    ),
                  ],
                ),
              );
              if (confirmed == true) {
                await storage.clearAllRecords();
                onChanged();
              }
            },
            child: const Text('Clear Local Game Records'),
          ),
        ],
      ),
    );
  }
}
