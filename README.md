# Cyber Arcade — Futuristic Web Gaming Platform

Cyber Arcade is a responsive cyberpunk web gaming portal featuring five original playable arcade games with local high-score persistence, synthesized audio effects, and dual desktop keyboard + mobile touch controls.

---

## Features & Application Pages

1. **Home / Arcade Lobby**:
   - Hero showcase (`ENTER THE ARCADE`) with instant **Play Now** launch.
   - Featured game spotlight (`Cyber Runner`) and responsive grid of all 5 arcade cabinets.
   - Live personal bests, total play statistics, recently played sessions, and control guides.
2. **Games Library**:
   - Search games in real time by title or description.
   - Filter by gameplay category (`All`, `Action`, `Reflex`, `Puzzle`, `Arcade`).
3. **Individual Game Screen**:
   - Dedicated interactive arena with `Start`, `Pause`, `Resume`, `Restart`, and `Game Over` states.
   - Live score counter, personal best tracking, and responsive desktop + touch controls.
4. **Leaderboard & Statistics**:
   - Local high scores and recent session history sorted by game or score value.
   - Stored locally on the current browser/device (`localStorage` / `shared_preferences`).
5. **Settings**:
   - Toggle synthesized sound effects, reduced motion, and on-screen touch controls.
   - Clear local game records with confirmation dialog.

---

## Playable Games & Controls

| Game | Genre | Desktop Controls | Mobile / Touch Controls |
| :--- | :--- | :--- | :--- |
| **1. Cyber Runner** | Endless Runner | `Space` / `Up Arrow` / `W` to Jump (Double-Jump), `Down Arrow` / `S` to Slide | On-screen `Jump` and `Slide` buttons or tap arena |
| **2. Neon Reflex** | Reaction Challenge | `Left Click`, `Spacebar`, or `Enter` on Cyan pulse | Tap inside the optical chamber on Cyan signal |
| **3. Memory Matrix** | Pattern Puzzle | Click tiles or `Arrow Keys` / `WASD` + `Spacebar` | Tap highlighted sequence tiles in exact order |
| **4. Space Shooter** | Survival Shooter | `WASD` / `Arrow Keys` to Move, `Spacebar` to Shoot | Drag on starfield or use on-screen D-Pad + Fire |
| **5. Cyber Snake** | Neon Grid Arcade | `Arrow Keys` or `WASD` to Steer, `P` to Pause | Swipe on grid or use on-screen directional buttons |

---

## Project Structure

```text
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── models/
│   │   └── game_model.dart
│   ├── services/
│   │   └── storage_service.dart
│   ├── theme/
│   │   └── cyber_theme.dart
│   ├── widgets/
│   │   └── game_card.dart
│   ├── screens/
│   │   ├── home_screen.dart
│   │   ├── games_library_screen.dart
│   │   ├── game_host_screen.dart
│   │   ├── leaderboard_screen.dart
│   │   └── settings_screen.dart
│   └── games/
│       ├── cyber_runner/cyber_runner_game.dart
│       ├── neon_reflex/neon_reflex_game.dart
│       ├── memory_matrix/memory_matrix_game.dart
│       ├── space_shooter/space_shooter_game.dart
│       └── cyber_snake/cyber_snake_game.dart
├── test/
│   └── arcade_test.dart
├── pubspec.yaml
├── src/ (Interactive Web Runtime for Browser Preview)
└── README.md
```

---

## Setup & Build Instructions

### Flutter Web Build
```bash
flutter pub get
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
flutter build web --release
```

### Interactive Web Runtime (Port 3000)
```bash
npm install
npm run dev
npm run build
```

---

## Pushing to GitHub (`Cyber-acrade_webgames`)

Run the following commands in your terminal to push the complete project to your GitHub repository (`https://github.com/Rohith0605/Cyber-acrade_webgames.git`):

```bash
git init
git add .
git commit -m "feat: complete Cyber Arcade Flutter Web gaming platform with 5 playable games"
git branch -M main
git remote add origin https://github.com/Rohith0605/Cyber-acrade_webgames.git
git push -u origin main
```

Once pushed, the GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically build the Flutter Web application and publish it to GitHub Pages at:
`https://rohith0605.github.io/Cyber-acrade_webgames/`
