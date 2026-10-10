import 'package:flutter/material.dart';
import 'app.dart';
import 'services/storage_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final storageService = StorageService();
  await storageService.init();
  runApp(CyberArcadeApp(storageService: storageService));
}
