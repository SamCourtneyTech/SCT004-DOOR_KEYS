import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import Player from "./Player";
import Door from "./Door";
import Camera from "./Camera";
import { useFrequencyGame } from "../lib/stores/useFrequencyGame";

// Simple mobile detection
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export default function GameScene() {
  const { currentLevel, doors, obstacles, groundGaps, gamePhase, cameraOffset } = useFrequencyGame();
  const [isMobile] = useState(isMobileDevice);
  
  // Calculate sky color progression from light blue to red based on level
  const getSkyColor = (level: number) => {
    const progress = Math.min(level / 100, 1); // Fully red at level 100
    const r = Math.floor(135 + (255 - 135) * progress); // 135 -> 255
    const g = Math.floor(206 * (1 - progress)); // 206 -> 0  
    const b = Math.floor(235 * (1 - progress)); // 235 -> 0
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const skyColor = getSkyColor(currentLevel);
  
  console.log("GameScene rendering, mobile:", isMobile, "phase:", gamePhase);

  return (
    <>
      {/* Dynamic camera that follows player forward */}
      <Camera />
      
      {/* Ground segments with potential gaps */}
      {Array.from({ length: 15 }, (_, i) => {
        const segmentZ = cameraOffset + (i - 7) * 20;
        
        // Check if this segment should have a gap
        const hasGap = groundGaps.some(gap => 
          Math.abs(gap.position[2] - segmentZ) < gap.length
        );
        
        if (hasGap) {
          // Render ground segments with gaps cut out
          const gap = groundGaps.find(gap => 
            Math.abs(gap.position[2] - segmentZ) < gap.length
          );
          
          if (!gap) return null;
          
          // Split ground into segments around the gap
          const leftWidth = 4 + gap.position[0] - gap.width/2;
          const rightWidth = 4 - gap.position[0] - gap.width/2;
          
          return (
            <group key={`ground-gap-${cameraOffset}-${i}`}>
              {/* Left side of ground */}
              {leftWidth > 0.5 && (
                <mesh 
                  receiveShadow 
                  position={[-4 + leftWidth/2, -0.5, segmentZ]} 
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <planeGeometry args={[leftWidth, 20]} />
                  <meshBasicMaterial color="#C0C0C0" />
                </mesh>
              )}
              
              {/* Right side of ground */}
              {rightWidth > 0.5 && (
                <mesh 
                  receiveShadow 
                  position={[4 - rightWidth/2, -0.5, segmentZ]} 
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <planeGeometry args={[rightWidth, 20]} />
                  <meshBasicMaterial color="#C0C0C0" />
                </mesh>
              )}
            </group>
          );
        } else {
          // Regular full ground segment
          return (
            <mesh 
              key={`ground-${cameraOffset}-${i}`}
              receiveShadow 
              position={[0, -0.5, segmentZ]} 
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[8, 20]} />
              <meshBasicMaterial color="#C0C0C0" />
            </mesh>
          );
        }
      })}
      
      {/* Progressive sky background - blue to red */}
      <color attach="background" args={[skyColor]} />

      {/* Player */}
      {gamePhase === 'playing' && <Player />}

      {/* Doors */}
      {doors.map((door, index) => (
        <Door
          key={`${currentLevel}-${index}`}
          position={door.position}
          frequency={door.frequency}
          isCorrect={door.isCorrect}
          doorIndex={index}
        />
      ))}

      {/* Rectangular holes in the ground (obstacles) - breaks in the path */}
      {obstacles.map((obstacle, index) => (
        <mesh 
          key={`hole-${currentLevel}-${index}`}
          position={[obstacle.position[0], -0.51, obstacle.position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[2.5, 1.5]} />
          <meshBasicMaterial color={skyColor} />
        </mesh>
      ))}
    </>
  );
}
