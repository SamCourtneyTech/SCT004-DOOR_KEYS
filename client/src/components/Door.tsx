import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useFrequencyGame } from "../lib/stores/useFrequencyGame";

interface DoorProps {
  position: [number, number, number];
  frequency: number;
  isCorrect: boolean;
  doorIndex: number;
}

export default function Door({ position, frequency, isCorrect, doorIndex }: DoorProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { selectDoor, playerPosition } = useFrequencyGame();

  // Animate door slightly
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + doorIndex) * 0.1;
    }
  });

  // Check if player is close enough to interact
  const playerDistance = playerPosition ? 
    Math.sqrt(
      Math.pow(playerPosition[0] - position[0], 2) + 
      Math.pow(playerPosition[2] - position[2], 2)
    ) : Infinity;

  const canInteract = playerDistance < 4; // Increased interaction range

  const handleClick = () => {
    if (canInteract) {
      selectDoor(doorIndex);
    }
  };

  // Color coding: correct door glows green slightly, others are blue
  const doorColor = isCorrect ? "#4CAF50" : "#2196F3";
  const emissiveColor = hovered && canInteract ? "#ffffff" : 
                       isCorrect ? "#1B5E20" : "#0D47A1";

  return (
    <group position={position}>
      {/* Door frame */}
      <mesh
        ref={meshRef}
        castShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick}
      >
        <boxGeometry args={[2.8, 4, 0.5]} />
        <meshLambertMaterial 
          color={doorColor}
          emissive={emissiveColor}
          emissiveIntensity={hovered && canInteract ? 0.2 : 0.1}
        />
      </mesh>

      {/* Door handle */}
      <mesh position={[0.7, 0, 0.3]} castShadow>
        <sphereGeometry args={[0.1]} />
        <meshLambertMaterial color="#FFD700" />
      </mesh>

      {/* Frequency label */}
      <Text
        position={[0, 2.5, 0.3]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {frequency}Hz
      </Text>

      {/* Walk through hint when close */}
      {canInteract && (
        <Text
          position={[0, -2.5, 0.3]}
          fontSize={0.3}
          color="#ffff00"
          anchorX="center"
          anchorY="middle"
        >
          Walk through to enter
        </Text>
      )}
    </group>
  );
}
