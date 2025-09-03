import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "menu" | "playing" | "paused" | "gameOver" | "scoreboard";

interface Door {
  position: [number, number, number];
  frequency: number;
  isCorrect: boolean;
}

interface FrequencyGameState {
  gamePhase: GamePhase;
  currentLevel: number;
  score: number;

  currentFrequency: number;
  doors: Door[];
  obstacles: Array<{ position: [number, number, number] }>;
  groundGaps: Array<{ position: [number, number, number]; width: number; length: number }>; // Ground gaps that require jumping
  playerPosition: [number, number, number] | null;
  cameraOffset: number; // Z position offset for progressive forward movement
  audioTransitionPhase: 'playing' | 'fadeOut' | 'fadeIn';
  doorProcessed: boolean; // Prevent multiple door triggers
  isPaused: boolean;
  
  // Actions
  initializeGame: () => void;
  startGame: () => void;
  restartGame: () => void;
  setGamePhase: (phase: GamePhase) => void;
  selectDoor: (doorIndex: number) => void;
  selectNearestDoor: () => void;
  updatePlayerPosition: (position: [number, number, number]) => void;
  generateLevel: () => void;
  moveForward: () => void; // Move camera and doors forward
  generateTargetFrequency: () => number;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
}

// Generate random frequency based on level progression
const generateRandomFrequency = (level: number = 1): number => {
  // Progressive frequency range based on level
  let minFreq = 120;
  let maxFreq: number;
  
  if (level < 20) {
    // Early levels: stay in lower range (120Hz - 2kHz) for easier discrimination
    maxFreq = 2000;
  } else if (level < 40) {
    // Mid levels: expand to mid-high range (120Hz - 10kHz)
    maxFreq = 10000;
  } else {
    // Advanced levels: full range (120Hz - 16kHz)
    maxFreq = 16000;
  }
  
  // Use logarithmic distribution for more natural frequency spread
  const minLog = Math.log(minFreq);
  const maxLog = Math.log(maxFreq);
  const randomLog = minLog + Math.random() * (maxLog - minLog);
  return Math.floor(Math.exp(randomLog)); // Always return whole numbers
};

// Calculate perceptually significant frequency difference based on level and frequency
const getPerceptualDifference = (frequency: number, level: number = 1): number => {
  // Base difference multiplier based on level (starts large, gets smaller)
  let levelMultiplier: number;
  
  if (level < 5) {
    levelMultiplier = 4.0; // Very large differences for first few levels
  } else if (level < 10) {
    levelMultiplier = 3.0; // Large differences for early levels
  } else if (level < 20) {
    levelMultiplier = 2.0; // Moderate differences until level 20
  } else if (level < 40) {
    levelMultiplier = 1.5; // Smaller differences in mid levels
  } else {
    levelMultiplier = 1.0; // Smallest differences for advanced levels
  }
  
  let baseDifference: number;
  if (frequency < 500) {
    // Low frequencies: larger absolute differences work well
    baseDifference = 50 + Math.random() * 50; // 50-100Hz base
  } else if (frequency < 2000) {
    // Mid frequencies: percentage-based difference
    baseDifference = frequency * (0.05 + Math.random() * 0.05); // 5-10% base
  } else if (frequency < 8000) {
    // High frequencies: larger percentage needed
    baseDifference = frequency * (0.08 + Math.random() * 0.07); // 8-15% base
  } else {
    // Very high frequencies: even larger percentage
    baseDifference = frequency * (0.12 + Math.random() * 0.08); // 12-20% base
  }
  
  return Math.floor(baseDifference * levelMultiplier); // Apply level scaling
};

export const useFrequencyGame = create<FrequencyGameState>()(
  subscribeWithSelector((set, get) => ({
    gamePhase: "menu",
    currentLevel: 1,
    score: 0,
    currentFrequency: 440,
    doors: [],
    obstacles: [],
    groundGaps: [],
    playerPosition: null,
    cameraOffset: 0,
    audioTransitionPhase: 'playing',
    doorProcessed: false,
    isPaused: false,

    initializeGame: () => {
      set({
        gamePhase: "menu",
        currentLevel: 1,
        score: 0,
        doors: [],
        obstacles: [],
        groundGaps: [],
        playerPosition: null,
        cameraOffset: 0,
      });
    },

    startGame: () => {
      console.log("Starting game...");
      try {
        set({
          gamePhase: "playing",
          currentLevel: 1,
          score: 0,
          playerPosition: [0, 1, 6], // Start behind doors
          cameraOffset: 0, // Reset camera offset to start fresh
          doorProcessed: false, // Reset door processing
          isPaused: false, // Ensure not paused
        });
        
        // Generate level with error handling
        try {
          get().generateLevel();
          console.log("Game started successfully, phase:", get().gamePhase);
        } catch (levelError) {
          console.error("Error generating level:", levelError);
          // Fallback to menu if level generation fails
          set({ gamePhase: "menu" });
        }
      } catch (error) {
        console.error("Error starting game:", error);
        // Fallback to menu if startup fails
        set({ gamePhase: "menu" });
      }
    },

    restartGame: () => {
      set({
        gamePhase: "menu",
        currentLevel: 1,
        score: 0,
        doors: [],
        obstacles: [],
        groundGaps: [],
        playerPosition: null,
        cameraOffset: 0, // Reset camera offset
        doorProcessed: false, // Reset door processing
      });
    },

    setGamePhase: (phase) => set({ gamePhase: phase }),

    selectDoor: (doorIndex) => {
      const { doors, currentLevel, score, doorProcessed } = get();
      
      // Prevent multiple door selections
      if (doorProcessed) return;
      set({ doorProcessed: true });
      
      // Handle death (falling off path or invalid door)
      if (doorIndex < 0 || doorIndex >= doors.length) {
        // Game over with falling animation delay
        setTimeout(() => {
          set({ gamePhase: "scoreboard" });
        }, 2000); // Longer delay to show falling
        return;
      }
      
      const selectedDoor = doors[doorIndex];
      if (!selectedDoor) return;

      if (selectedDoor.isCorrect) {
        // Correct door selected - advance level
        const newScore = score + 1; // Simple +1 scoring per door
        const newLevel = currentLevel + 1;
        
        // Smooth transition with proper timing
        setTimeout(() => {
          const nextFrequency = get().generateTargetFrequency();
          set({ currentFrequency: nextFrequency });
        }, 100);
        
        // Move everything forward for the next level
        get().moveForward();
        
        set({
          score: newScore,
          currentLevel: newLevel,
          // Reset player to proper starting position for next level
          playerPosition: [0, 1, 6],
        });
        
        // Generate next level with smoother timing
        setTimeout(() => {
          get().generateLevel();
        }, 150);
      } else {
        // Wrong door selected - game over instantly
        setTimeout(() => {
          set({ gamePhase: "scoreboard" });
        }, 200);
      }
    },

    selectNearestDoor: () => {
      const { doors, playerPosition } = get();
      if (!playerPosition) return;

      let nearestDoorIndex = -1;
      let minDistance = Infinity;

      doors.forEach((door, index) => {
        const distance = Math.sqrt(
          Math.pow(playerPosition[0] - door.position[0], 2) +
          Math.pow(playerPosition[2] - door.position[2], 2)
        );
        
        if (distance < minDistance && distance < 4) {
          minDistance = distance;
          nearestDoorIndex = index;
        }
      });

      if (nearestDoorIndex >= 0) {
        get().selectDoor(nearestDoorIndex);
      }
    },

    updatePlayerPosition: (position) => set({ playerPosition: position }),

    generateLevel: () => {
      const { currentLevel, cameraOffset } = get();
      
      // Clear previous level state
      set({ 
        doors: [], 
        obstacles: [],
        groundGaps: [],
        audioTransitionPhase: 'fadeOut',
        doorProcessed: false, // Reset for new level
      });
      
      // Always use exactly 2 doors as requested
      const doorCount = 2;
      
      // Generate random correct frequency based on current level
      const correctFrequency = generateRandomFrequency(currentLevel);
      
      // Generate frequency variations for this level
      const frequencies: number[] = [];
      frequencies.push(correctFrequency);
      
      // Add one incorrect frequency using level-based perceptual difference
      let incorrectFreq;
      do {
        const variation = getPerceptualDifference(correctFrequency, currentLevel);
        const direction = Math.random() > 0.5 ? 1 : -1;
        incorrectFreq = correctFrequency + (direction * variation);
        
        // Determine max frequency for current level
        let maxAllowed = currentLevel < 20 ? 2000 : currentLevel < 40 ? 10000 : 16000;
        
        // Ensure incorrect frequency stays within level-appropriate range
        if (incorrectFreq < 120 || incorrectFreq > maxAllowed) {
          incorrectFreq = correctFrequency + (-direction * variation);
        }
        
        // Final bounds check
        if (incorrectFreq < 120) incorrectFreq = 120;
        if (incorrectFreq > maxAllowed) incorrectFreq = maxAllowed;
        
      } while (Math.abs(incorrectFreq - correctFrequency) < getPerceptualDifference(correctFrequency, currentLevel) * 0.5);
      frequencies.push(incorrectFreq);

      // Shuffle frequencies
      for (let i = frequencies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [frequencies[i], frequencies[j]] = [frequencies[j], frequencies[i]];
      }

      // Create doors - position them close together and on the ground
      const doors: Door[] = [];
      const spacing = 3; // Very close spacing between doors
      const startX = -spacing / 2;

      for (let i = 0; i < doorCount; i++) {
        const x = startX + i * spacing;
        doors.push({
          position: [x, 1, cameraOffset - 5], // Position doors closer and relative to camera offset
          frequency: frequencies[i],
          isCorrect: frequencies[i] === correctFrequency,
        });
      }

      // Generate obstacles - place them randomly but keep clear area around doors
      const obstacles = [];
      const obstacleCount = 3 + Math.floor(currentLevel / 3); // More obstacles as levels increase
      
      for (let i = 0; i < obstacleCount; i++) {
        let obstacleX, obstacleZ;
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < 20) {
          obstacleX = (Math.random() - 0.5) * 6; // Random X within path width
          obstacleZ = cameraOffset - 15 - (Math.random() * 5); // Between user and doors only
          
          // Check safety zones - must be far from doors and not too close to user spawn
          let tooCloseToAnyDoor = false;
          let tooCloseToUserSpawn = false;
          
          // Check door safety zone (6 unit buffer)
          for (const door of doors) {
            const distanceToDoor = Math.sqrt(
              Math.pow(obstacleX - door.position[0], 2) + 
              Math.pow(obstacleZ - door.position[2], 2)
            );
            if (distanceToDoor < 6) {
              tooCloseToAnyDoor = true;
              break;
            }
          }
          
          // Check user spawn safety zone (8 units from camera position)
          const distanceFromUser = Math.abs(obstacleZ - cameraOffset);
          if (distanceFromUser < 8) {
            tooCloseToUserSpawn = true;
          }
          
          // Only place if in the corridor between user and doors, with proper safety zones
          const isBetweenUserAndDoors = obstacleZ < cameraOffset - 8 && obstacleZ > cameraOffset - 25;
          
          validPosition = !tooCloseToAnyDoor && !tooCloseToUserSpawn && isBetweenUserAndDoors;
          attempts++;
        }
        
        if (validPosition && obstacleX !== undefined && obstacleZ !== undefined) {
          obstacles.push({
            position: [obstacleX, 0.5, obstacleZ] as [number, number, number]
          });
        }
      }

      // Generate ground gaps based on level difficulty
      const groundGaps = [];
      
      // Start adding ground gaps after level 3, increase frequency with level
      if (currentLevel >= 3) {
        const gapChance = Math.min(0.3 + (currentLevel - 3) * 0.05, 0.8); // 30% to 80% chance
        
        if (Math.random() < gapChance) {
          // Generate 1-2 ground gaps per level
          const numGaps = Math.random() < 0.7 ? 1 : 2;
          
          for (let i = 0; i < numGaps; i++) {
            // Position gaps between player spawn and doors, but not too close to either
            const gapZ = cameraOffset - 8 - (Math.random() * 10); // Between spawn and doors
            const gapX = (Math.random() - 0.5) * 4; // Across the path width
            
            // Make gaps harder to jump over as levels increase
            const gapWidth = Math.min(2 + (currentLevel - 3) * 0.1, 4); // 2-4 units wide
            const gapLength = Math.min(1.5 + (currentLevel - 3) * 0.05, 3); // 1.5-3 units long
            
            // Don't place gaps too close to doors or spawn
            let tooCloseToSpawn = Math.abs(gapZ - (cameraOffset + 6)) < 3;
            let tooCloseToDoors = Math.abs(gapZ - (cameraOffset - 5)) < 3;
            
            if (!tooCloseToSpawn && !tooCloseToDoors) {
              groundGaps.push({
                position: [gapX, -0.5, gapZ] as [number, number, number],
                width: gapWidth,
                length: gapLength
              });
            }
          }
        }
      }

      set({
        doors,
        obstacles,
        groundGaps,
        currentFrequency: correctFrequency,
        doorProcessed: false, // Reset for new level
      });
    },

    moveForward: () => {
      const { cameraOffset, playerPosition } = get();
      
      if (!playerPosition) return;
      
      // Smoother transition: gradually move camera to player position
      const playerZ = playerPosition[2];
      const targetOffset = playerZ - 8; // Position camera 8 units behind player
      
      // Animate camera movement over time instead of instant jump
      const animateCamera = () => {
        const currentOffset = get().cameraOffset;
        const diff = targetOffset - currentOffset;
        
        if (Math.abs(diff) > 0.1) {
          const newOffset = currentOffset + (diff * 0.1); // Smooth interpolation
          set({ cameraOffset: newOffset });
          requestAnimationFrame(animateCamera);
        } else {
          set({ cameraOffset: targetOffset });
        }
      };
      
      animateCamera();
    },

    // Helper function to generate target frequency for next level
    generateTargetFrequency: () => {
      const { currentLevel } = get();
      return generateRandomFrequency(currentLevel);
    },

    pauseGame: () => {
      set({ isPaused: true, gamePhase: "paused" });
    },

    resumeGame: () => {
      set({ isPaused: false, gamePhase: "playing" });
    },

    endGame: () => {
      // Kill player immediately and go to scoreboard
      set({ gamePhase: "scoreboard" });
    },


  }))
);
