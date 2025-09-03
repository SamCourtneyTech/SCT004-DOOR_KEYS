# Overview

This is a 3D frequency-based puzzle game built with React Three Fiber, where players navigate through levels and select doors that match specific audio frequencies. The game features immersive 3D graphics, spatial audio, and progressive difficulty levels with scoring and lives systems.

## Recent Changes (January 2025)
- ✅ Fixed critical mobile compatibility issues (white screen, infinite play loop)
- ✅ Resolved "Button is not part of THREE namespace" error by separating TouchControls from Canvas
- ✅ Created dedicated touch input store system for proper mobile control handling
- ✅ Mobile game fully functional with touch controls working on iPhone
- ✅ Made floor width consistent between mobile (8 units) and desktop versions
- ✅ Cleaned up mobile UI: removed phase indicator, door button, and excessive instructional text
- ✅ Simplified mobile interface to show only score and essential controls
- 🚧 Working on WordPress embedding with proper deployment URL

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React Three Fiber**: 3D rendering engine for creating immersive game environments
- **Zustand**: State management with subscriptions for game logic and audio control
- **Radix UI + Tailwind CSS**: Component library and styling system for UI elements
- **TypeScript**: Type safety across all components and game logic
- **Vite**: Development server and build tool with HMR support

## Game Structure
- **Component-based 3D scenes**: Modular components for Player, Doors, GameScene, and UI overlays
- **State-driven game phases**: Menu, playing, game over, and scoreboard states
- **Real-time audio synthesis**: Web Audio API integration for frequency generation and spatial audio
- **Keyboard controls**: WASD movement with interaction keys for gameplay
- **Local storage persistence**: High scores and game preferences stored client-side

## Data Management
- **Game state store**: Centralized game logic with level progression, scoring, and player stats
- **Audio state store**: Separate audio management with mute controls and sound effects
- **Local storage**: High scores, player preferences, and game state persistence

## Backend Architecture
- **Express.js server**: RESTful API foundation with middleware for logging and error handling
- **Drizzle ORM**: Database abstraction layer with PostgreSQL support
- **Memory storage fallback**: In-memory data storage for development without database
- **Modular route structure**: Organized API endpoints with storage interface abstraction

## External Dependencies

- **Neon Database**: PostgreSQL hosting service for production data storage
- **React Query**: Server state management and caching for API interactions
- **Web Audio API**: Browser-native audio synthesis and spatial audio processing
- **Local Storage API**: Client-side data persistence for game progress and settings