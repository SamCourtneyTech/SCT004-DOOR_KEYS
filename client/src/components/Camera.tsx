import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFrequencyGame } from '../lib/stores/useFrequencyGame';

export default function Camera() {
  const { camera } = useThree();
  const { cameraOffset, playerPosition } = useFrequencyGame();
  const targetPosition = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3());

  // Initialize camera position
  useEffect(() => {
    const initialPosition = new THREE.Vector3(0, 8, cameraOffset + 15);
    camera.position.copy(initialPosition);
    currentPosition.current.copy(initialPosition);
  }, [camera, cameraOffset]);

  useFrame((state, delta) => {
    if (!playerPosition) return;

    // Calculate target camera position based on player and camera offset
    const playerZ = playerPosition[2];
    const targetZ = Math.max(cameraOffset + 10, playerZ + 6); // Stay farther behind player 
    
    targetPosition.current.set(0, 8, targetZ);

    // Smooth camera movement
    currentPosition.current.lerp(targetPosition.current, delta * 2);
    camera.position.copy(currentPosition.current);

    // Always look slightly ahead of the player
    const lookAtZ = playerZ - 2;
    camera.lookAt(0, 0, lookAtZ);
  });

  return null;
}