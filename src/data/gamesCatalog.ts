import { GameMetadata } from '../types/arcade';
import heroBannerImg from '../assets/images/cyber_arcade_hero_1791629375380.jpg';
import cyberRunnerImg from '../assets/images/game_cyber_runner_1791629386658.jpg';
import neonReflexImg from '../assets/images/game_neon_reflex_1791629400282.jpg';
import memoryMatrixImg from '../assets/images/game_memory_matrix_1791629411528.jpg';
import spaceShooterImg from '../assets/images/game_space_shooter_1791629425159.jpg';
import cyberSnakeImg from '../assets/images/game_cyber_snake_1791629441221.jpg';

export const HERO_BANNER_IMAGE = heroBannerImg;

export const GAMES_CATALOG: GameMetadata[] = [
  {
    id: 'cyber_runner',
    title: 'Cyber Runner',
    subtitle: 'High-Velocity Rooftop Sprint',
    category: 'Action',
    difficulty: 'Moderate',
    scoreUnit: 'pts',
    description:
      'Sprint automatically across a neon rooftop highway. Vault over ground laser barriers, slide beneath aerial security drones, and collect cyan data shards as velocity escalates.',
    desktopControls: 'Space / Up Arrow / W to Jump (Double-Jump supported) · Down Arrow / S to Slide',
    mobileControls: 'Tap Jump or Slide buttons below the arena, or tap right/left halves of the canvas',
    rules: [
      'Your runner accelerates continuously along the sector highway.',
      'Jump over ground laser pylons and double-jump across wide voltage barriers.',
      'Slide underneath high-altitude patrol drones to avoid collision.',
      'Collect floating cyan data shards for +50 bonus points and dodge obstacles for +25 points.',
    ],
    accentColor: '#22D3EE',
    image: cyberRunnerImg,
    featured: true,
  },
  {
    id: 'neon_reflex',
    title: 'Neon Reflex',
    subtitle: 'Optical Reaction Benchmark',
    category: 'Reflex',
    difficulty: 'Accessible',
    scoreUnit: 'ms',
    lowerIsBetter: true,
    description:
      'Test your neural response speed across five precision rounds. Hold steady while the optical chamber arms, then strike the instant the cyan pulse ignites without false-starting.',
    desktopControls: 'Left Mouse Click or Spacebar / Enter when the signal turns Cyan',
    mobileControls: 'Tap anywhere inside the optical reaction chamber when the signal flashes',
    rules: [
      'Each session consists of 5 timed reaction rounds.',
      'Wait while the chamber is Armed (Amber/Crimson). Clicking early triggers a False Start.',
      'React immediately when the chamber flashes Cyan ("STRIKE NOW").',
      'Your 5-round average reaction time (in milliseconds) is recorded—lower times rank higher.',
    ],
    accentColor: '#E879F9',
    image: neonReflexImg,
  },
  {
    id: 'memory_matrix',
    title: 'Memory Matrix',
    subtitle: 'Sequential Neural Grid Puzzle',
    category: 'Puzzle',
    difficulty: 'Moderate',
    scoreUnit: 'pts',
    description:
      'Observe the sequence of illuminated quantum tiles on the matrix board, commit the pattern to memory, and reconstruct the exact node order as sequence depth increases each level.',
    desktopControls: 'Mouse Click on tiles, or Arrow Keys / WASD + Spacebar to select tiles',
    mobileControls: 'Tap the matrix tiles directly in the exact order shown',
    rules: [
      'Watch carefully as the matrix highlights a sequence of tiles with audio-visual cues.',
      'Once the board unlocks, repeat the exact sequence of tiles in order.',
      'Every completed round advances the Matrix Level and increases the sequence length by 1.',
      'A single wrong tile ends the session and records your final score.',
    ],
    accentColor: '#A855F7',
    image: memoryMatrixImg,
  },
  {
    id: 'space_shooter',
    title: 'Space Shooter',
    subtitle: 'Starfighter Survival Defense',
    category: 'Action',
    difficulty: 'Challenging',
    scoreUnit: 'pts',
    description:
      'Pilot the V-7 Starhawk through deep-space drone waves. Weave between incoming plasma fire, collect twin-cannon overdrive cores, and survive escalating alien squadrons.',
    desktopControls: 'Arrow Keys or WASD to Move · Spacebar to Fire (or toggle Auto-Fire)',
    mobileControls: 'On-screen directional control pad + Fire & Auto-Fire toggle buttons',
    rules: [
      'Pilot your starfighter across the arena and destroy incoming alien squadrons.',
      'Intercept cyan Overdrive pickups for twin/triple plasma cannons and green Repair cores for hull integrity.',
      'Avoid direct collisions and enemy projectiles; your ship has 3 hull shield charges.',
      'Difficulty and enemy squadron density increase with each cleared wave.',
    ],
    accentColor: '#38BDF8',
    image: spaceShooterImg,
  },
  {
    id: 'cyber_snake',
    title: 'Cyber Snake',
    subtitle: 'Grid Serpent Energy Collector',
    category: 'Arcade',
    difficulty: 'Accessible',
    scoreUnit: 'pts',
    description:
      'Guide a glowing cyber-serpent across a precision grid to absorb magenta energy orbs and golden overdrive nodes. Grow longer and faster without colliding with the perimeter or your own tail.',
    desktopControls: 'Arrow Keys or WASD to Steer · P to Pause',
    mobileControls: 'Swipe on the board or use the ergonomic on-screen directional D-Pad',
    rules: [
      'Steer the serpent continuously along the 22x18 grid.',
      'Absorb Magenta Energy Orbs (+100 pts) to grow longer and increase movement speed.',
      'Capture timed Golden Overdrive Cores (+250 pts) before they decay.',
      'Colliding with the arena boundary wall or your own body segments ends the run.',
    ],
    accentColor: '#22D3EE',
    image: cyberSnakeImg,
  },
];

export function getGameById(id: string): GameMetadata {
  return GAMES_CATALOG.find((g) => g.id === id) || GAMES_CATALOG[0];
}
