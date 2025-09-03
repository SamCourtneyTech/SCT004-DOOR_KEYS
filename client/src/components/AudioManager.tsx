import { useEffect, useRef } from "react";
import { useFrequencyGame } from "../lib/stores/useFrequencyGame";
import { createTone, stopTone } from "../lib/audioUtils";

export default function AudioManager() {
  const { currentFrequency, gamePhase, playerPosition, doors, audioTransitionPhase } = useFrequencyGame();
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // Initialize audio context on user interaction
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    // Add event listeners for user interaction
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, initAudio, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, initAudio);
      });
    };
  }, []);

  // Simple audio management - recreate tone when frequency changes
  useEffect(() => {
    if (gamePhase === 'playing' && currentFrequency && audioContextRef.current && playerPosition && doors.length > 0) {
      // Stop any existing tone
      if (oscillatorRef.current) {
        stopTone(oscillatorRef.current, gainNodeRef.current);
      }

      // Create new tone with proper fade in
      const { oscillator, gainNode } = createTone(audioContextRef.current, currentFrequency, 0.1);
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;
    } else {
      // Stop tone when not playing
      if (oscillatorRef.current) {
        stopTone(oscillatorRef.current, gainNodeRef.current);
        oscillatorRef.current = null;
        gainNodeRef.current = null;
      }
    }

    return () => {
      if (oscillatorRef.current) {
        stopTone(oscillatorRef.current, gainNodeRef.current);
      }
    };
  }, [gamePhase, currentFrequency]);

  // Update volume based on player distance to doors
  useEffect(() => {
    if (gamePhase === 'playing' && gainNodeRef.current && playerPosition && doors.length > 0) {
      // Find the closest door
      let minDistance = Infinity;
      doors.forEach(door => {
        const distance = Math.sqrt(
          Math.pow(playerPosition[0] - door.position[0], 2) +
          Math.pow(playerPosition[2] - door.position[2], 2)
        );
        minDistance = Math.min(minDistance, distance);
      });

      // Calculate volume based on distance (closer = louder)
      const maxDistance = 15; // Distance at which audio becomes silent
      const normalizedDistance = Math.min(minDistance, maxDistance) / maxDistance;
      const volume = Math.max(0.02, (1 - normalizedDistance) * 0.15); // Min 0.02, max 0.15 volume

      // Smoothly adjust the volume
      gainNodeRef.current.gain.linearRampToValueAtTime(
        volume, 
        gainNodeRef.current.context.currentTime + 0.1
      );
    }
  }, [playerPosition, doors, gamePhase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        stopTone(oscillatorRef.current, gainNodeRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
