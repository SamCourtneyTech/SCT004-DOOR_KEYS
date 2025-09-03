import { useRef } from "react";
import * as THREE from "three";
import Player from "./Player";
import Door from "./Door";
import Camera from "./Camera";
import { useFrequencyGame } from "../lib/stores/useFrequencyGame";

// Ultra-simple mobile-optimized game scene
export default function SimpleGameScene() {
  const { currentLevel, doors, gamePhase, cameraOffset } = useFrequencyGame();
  
  console.log("SimpleGameScene rendering, phase:", gamePhase, "doors:", doors.length);
  
  return (
    <>
      {/* Dynamic camera that follows player forward */}
      <Camera />
      
      {/* Simple ground plane - same width as desktop version */}
      <mesh 
        receiveShadow 
        position={[0, -0.5, cameraOffset]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[8, 200]} />
        <meshBasicMaterial color="#C0C0C0" />
      </mesh>
      
      {/* Simple sky color */}
      <color attach="background" args={["#87CEEB"]} />

      {/* Player */}
      {gamePhase === 'playing' && <Player />}

      {/* Doors - simplified */}
      {doors.map((door, index) => (
        <Door
          key={`${currentLevel}-${index}`}
          position={door.position}
          frequency={door.frequency}
          isCorrect={door.isCorrect}
          doorIndex={index}
        />
      ))}
    </>
  );
}