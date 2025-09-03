import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { useFrequencyGame } from "../lib/stores/useFrequencyGame";
import { useTouchInput } from "../lib/stores/useTouchInput";

enum Controls {
  forward = 'forward',
  backward = 'backward',
  leftward = 'leftward',
  rightward = 'rightward',
  interact = 'interact',
  jump = 'jump',
  pause = 'pause'
}

export default function Player() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { updatePlayerPosition, selectNearestDoor, selectDoor, pauseGame, resumeGame } = useFrequencyGame();
  const { touchMovement, touchJumpPressed, touchInteractPressed, setTouchMovement, resetAllTouchInput } = useTouchInput();
  const get = useFrequencyGame.getState;
  const [subscribe, getKeys] = useKeyboardControls<Controls>();

  const velocity = useRef(new THREE.Vector3());
  const position = useRef(new THREE.Vector3(0, 1, 6)); // Start behind doors
  const isGrounded = useRef(true);
  const hasFallenOff = useRef(false);
  const groundLevel = 1;

  // Reset player position when game starts
  useEffect(() => {
    const { gamePhase } = get();
    if (gamePhase === "playing") {
      // Reset player to starting position when game starts
      position.current.set(0, 1, 6);
      velocity.current.set(0, 0, 0);
      isGrounded.current = true;
      hasFallenOff.current = false;
      
      // Reset touch input state for mobile
      resetAllTouchInput();
    }
  }, [get().gamePhase, setTouchMovement]);

  // Handle pause key
  useEffect(() => {
    const unsubscribe = subscribe(
      (state) => state.pause,
      (pressed) => {
        if (pressed) {
          const { gamePhase } = get();
          if (gamePhase === "playing") {
            pauseGame();
          } else if (gamePhase === "paused") {
            resumeGame();
          }
        }
      }
    );
    return unsubscribe;
  }, [subscribe, pauseGame, resumeGame]);

  // Handle interact key
  useEffect(() => {
    const unsubscribe = subscribe(
      (state) => state.interact,
      (pressed) => {
        if (pressed) {
          console.log("Interact key pressed");
          selectNearestDoor();
        }
      }
    );
    return unsubscribe;
  }, [subscribe, selectNearestDoor]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Don't update player if game is paused
    const { gamePhase } = get();
    if (gamePhase === "paused") return;

    const keys = getKeys();
    const speed = 6; // Faster movement speed
    const dampening = 0.8;

    // Apply dampening
    velocity.current.multiplyScalar(dampening);

    // Handle keyboard input
    if (keys.forward) {
      velocity.current.z -= speed * delta;
    }
    if (keys.backward) {
      velocity.current.z += speed * delta;
    }
    if (keys.leftward) {
      velocity.current.x -= speed * delta;
    }
    if (keys.rightward) {
      velocity.current.x += speed * delta;
    }
    
    // Handle touch input
    if (touchMovement.x !== 0 || touchMovement.z !== 0) {
      velocity.current.x += touchMovement.x * speed * delta;
      velocity.current.z += touchMovement.z * speed * delta;
    }

    // Handle jumping with even slower jump (keyboard or touch)
    if ((keys.jump || touchJumpPressed) && isGrounded.current) {
      velocity.current.y = 1; // Even slower jump velocity
      isGrounded.current = false;
    }

    // Touch interact removed for mobile - doors activated by walking through them

    // Apply gravity (even lighter for very slow movement)
    if (!isGrounded.current) {
      velocity.current.y -= 3 * delta; // Very light gravity for slow jump
    }

    // Store old position for collision check
    const oldPosition = position.current.clone();
    
    // Update position
    position.current.add(velocity.current);

    // Get camera offset for dynamic constraints
    const { cameraOffset } = get();
    
    // Check if player is off the path
    const isOffPath = Math.abs(position.current.x) > 3.5;
    
    if (isOffPath) {
      // Mark that player has fallen off
      hasFallenOff.current = true;
    }
    
    if (hasFallenOff.current) {
      // Once fallen off, player can't get back on - keep falling
      velocity.current.y -= 8 * delta; // Apply strong gravity when falling off
      isGrounded.current = false;
      
      // Only trigger death after they've fallen significantly
      if (position.current.y < -10) {
        selectDoor(-1); // Invalid door index triggers death
        return;
      }
    } else {
      // Normal ground collision only when still on the path
      if (position.current.y <= groundLevel && velocity.current.y <= 0) {
        position.current.y = groundLevel;
        velocity.current.y = 0;
        isGrounded.current = true;
      }
    }
    
    // Ground collision is now handled in the path constraint section above
    
    // Check for ground gap collisions
    const { obstacles, groundGaps } = get();
    
    // Check for gap collisions first
    groundGaps.forEach(gap => {
      const playerInGapX = Math.abs(position.current.x - gap.position[0]) < gap.width / 2;
      const playerInGapZ = Math.abs(position.current.z - gap.position[2]) < gap.length / 2;
      
      if (playerInGapX && playerInGapZ && position.current.y <= groundLevel + 0.5) {
        // Player is in a ground gap - they should fall
        hasFallenOff.current = true;
      }
    });
    
    // Check for hole collisions (obstacles are now holes in the ground)
    obstacles.forEach(obstacle => {
      const obstacleDistance = Math.sqrt(
        Math.pow(position.current.x - obstacle.position[0], 2) +
        Math.pow(position.current.z - obstacle.position[2], 2)
      );
      
      // If player steps into hole while on ground (didn't jump over it)
      if (obstacleDistance < 1.5 && position.current.y <= groundLevel + 0.1) {
        selectDoor(-1); // Trigger death - fell into hole
        return;
      }
    });

    // Check for door collision (walking through doors) - improved bounding box collision
    const { doors } = get();
    doors.forEach((door, index) => {
      // Player bounding box (make player "hitbox" slightly larger than visual)
      const playerWidth = 1.2;  // Increased from 1 to 1.2 for better collision
      const playerDepth = 1.2;  // Increased from 1 to 1.2 for better collision
      
      // Door bounding box (doors are 2.8 wide, 0.5 deep)
      const doorWidth = 2.8;
      const doorDepth = 0.5;
      
      // Check if player bounding box overlaps with door bounding box
      const playerLeft = position.current.x - playerWidth / 2;
      const playerRight = position.current.x + playerWidth / 2;
      const playerFront = position.current.z - playerDepth / 2;
      const playerBack = position.current.z + playerDepth / 2;
      
      const doorLeft = door.position[0] - doorWidth / 2;
      const doorRight = door.position[0] + doorWidth / 2;
      const doorFront = door.position[2] - doorDepth / 2;
      const doorBack = door.position[2] + doorDepth / 2;
      
      // Check for bounding box intersection
      const xOverlap = playerRight > doorLeft && playerLeft < doorRight;
      const zOverlap = playerBack > doorFront && playerFront < doorBack;
      
      if (xOverlap && zOverlap) {
        selectDoor(index);
      }
    });

    // Apply to mesh
    meshRef.current.position.copy(position.current);

    // Update game state
    updatePlayerPosition([position.current.x, position.current.y, position.current.z]);
  });

  // Sync player position with game state when level changes
  useEffect(() => {
    const { playerPosition: gamePlayerPosition } = get();
    if (gamePlayerPosition) {
      position.current.set(gamePlayerPosition[0], gamePlayerPosition[1], gamePlayerPosition[2]);
      velocity.current.set(0, 0, 0); // Stop all movement when position is reset
    }
  }, [get().currentLevel, get().playerPosition]);

  // Touch control handlers
  const handleTouchMove = (direction: { x: number; z: number }) => {
    setTouchMovement(direction);
  };

  const handleTouchJump = () => {
    if (isGrounded.current) {
      velocity.current.y = 1;
      isGrounded.current = false;
    }
  };

  const handleTouchInteract = () => {
    selectNearestDoor();
  };

  return (
    <mesh ref={meshRef} castShadow position={[0, 1, 6]}>
      <boxGeometry args={[1, 2, 1]} />
      <meshLambertMaterial color="#ff6b6b" />
    </mesh>
  );
}
