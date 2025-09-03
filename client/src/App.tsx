import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/inter";
import "./index.css";

import Game from "./components/Game";
import GameUI from "./components/GameUI";
import Scoreboard from "./components/Scoreboard";
import TouchControls from "./components/TouchControls";
import { useFrequencyGame } from "./lib/stores/useFrequencyGame";

// Define control keys for the game
enum Controls {
  forward = 'forward',
  backward = 'backward',
  leftward = 'leftward',
  rightward = 'rightward',
  interact = 'interact',
  jump = 'jump',
  pause = 'pause'
}

const controls = [
  { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
  { name: Controls.backward, keys: ["KeyS", "ArrowDown"] },
  { name: Controls.leftward, keys: ["KeyA", "ArrowLeft"] },
  { name: Controls.rightward, keys: ["KeyD", "ArrowRight"] },
  { name: Controls.interact, keys: ["KeyE"] },
  { name: Controls.jump, keys: ["Space"] },
  { name: Controls.pause, keys: ["KeyP", "Escape"] },
];

const queryClient = new QueryClient();

// Main App component
function App() {
  const { gamePhase } = useFrequencyGame();
  const [showCanvas, setShowCanvas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show the canvas once everything is loaded, with error handling
  useEffect(() => {
    try {
      // Add a small delay to ensure everything is ready
      const timer = setTimeout(() => setShowCanvas(true), 100);
      return () => clearTimeout(timer);
    } catch (err) {
      console.error("Error initializing app:", err);
      setError("Failed to initialize game. Please refresh.");
    }
  }, []);

  // Handle errors gracefully
  if (error) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#000',
        color: '#fff',
        fontSize: '18px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <h2>Game Loading Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Refresh Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        {showCanvas && (
          <KeyboardControls map={controls}>
            <Canvas
              shadows={false} // Disable shadows for better mobile performance
              frameloop="demand" // Only render when needed for better performance
              camera={{
                position: [0, 8, 15],
                fov: window.innerWidth < 768 ? 75 : 60, // Wider FOV on mobile
                near: 0.1,
                far: 1000
              }}
              gl={{
                antialias: false, // Disable antialiasing for better mobile performance
                powerPreference: "low-power", // Better for mobile devices
                alpha: false, // Disable alpha for better performance
                premultipliedAlpha: false,
                preserveDrawingBuffer: false, // Better for mobile memory
                failIfMajorPerformanceCaveat: false, // Allow fallback to software rendering
                stencil: false // Disable stencil buffer for performance
              }}
              dpr={[1, 2]} // Limit device pixel ratio for performance
              performance={{ min: 0.5 }} // Allow lower performance mode
              onCreated={(state) => {
                console.log("Three.js Canvas created successfully");
                // Set up context loss recovery
                const canvas = state.gl.domElement;
                const handleContextLoss = (event: Event) => {
                  console.log("WebGL context lost, attempting recovery...");
                  event.preventDefault();
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                };
                canvas.addEventListener('webglcontextlost', handleContextLoss);
                
                // Ensure pixel ratio doesn't exceed 2 for performance
                state.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
              }}
              onError={(error) => {
                console.error("Three.js Canvas error:", error);
                setError("Graphics initialization failed. Try refreshing the page or using a different browser.");
              }}
            >
              {/* Background handled in GameScene */}
              
              {/* Ambient lighting */}
              <ambientLight intensity={0.3} />
              
              {/* Directional light */}
              <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />

              <Suspense fallback={null}>
                <Game />
              </Suspense>
            </Canvas>
          </KeyboardControls>
        )}
        
        {/* UI overlays - outside Canvas to avoid THREE.js conflicts */}
        <GameUI />
        {gamePhase === 'scoreboard' && <Scoreboard />}
        
        {/* Touch controls - outside Canvas for mobile */}
        <TouchControls 
          onMove={(direction) => {
            // Handled through touch input store
          }}
          onJump={() => {
            // Handled through touch input store
          }}
          onInteract={() => {
            // Handled through touch input store
          }}
        />
      </div>
    </QueryClientProvider>
  );
}

export default App;
