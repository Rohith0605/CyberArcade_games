import 'package:flutter/material.dart';

class CyberTheme {
  static const Color background = Color(0xFF090D16);
  static const Color surface = Color(0xFF0E1525);
  static const Color cyanAccent = Color(0xFF22D3EE);
  static const Color purpleAccent = Color(0xFFA855F7);
  static const Color magentaAccent = Color(0xFFE879F9);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: cyanAccent,
      colorScheme: const ColorScheme.dark(
        primary: cyanAccent,
        secondary: purpleAccent,
        surface: surface,
      ),
      cardTheme: CardTheme(
        color: surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFF1E293B)),
        ),
      ),
      useMaterial3: true,
    );
  }
}
