# Base Game Platform

A stable foundation for developing multiplayer 3D games using React and Three.js.

## Features

- **Dual View System**: Switch between 1st and 3rd person perspectives
- **Avatar System**: JSON-based 3D avatars (Hector Rivera included)
- **Multiplayer Lobby**: Auto-join lobby with room creation
- **Networking**: WebSocket-based communication (VoIP ready)
- **Responsive Design**: Optimized for mobile and desktop
- **Modular Architecture**: Clean, maintainable code structure

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

## Architecture

```
src/
├── components/     # UI Components
├── views/         # 1st/3rd Person Views (Separate)
├── systems/       # Game Systems
├── utils/         # Utilities & Optimization
├── stores/        # State Management
├── hooks/         # React Hooks
└── types/         # TypeScript Definitions
```

## Usage

1. **Homepage**: Platform overview and entry point
2. **Avatar Selection**: Choose Hector avatar
3. **Lobby**: Auto-join multiplayer lobby
4. **Game View**: Enter 3D environment with view switching

## Controls

**3rd Person**:
- Left click + drag: Rotate view
- Right click + drag: Pan
- Scroll: Zoom

**1st Person**:
- Click to lock mouse cursor
- WASD: Movement
- Mouse: Look around

## Platform Ready

Built as a foundation for:
- Racing games
- Fighting games  
- Role-playing games
- Any multiplayer 3D experience

Ready for server integration and VoIP implementation.
