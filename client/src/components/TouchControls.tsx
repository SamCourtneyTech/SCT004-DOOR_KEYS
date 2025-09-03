import { useState, useEffect } from "react";
import { useFrequencyGame } from "../lib/stores/useFrequencyGame";
import { useTouchInput } from "../lib/stores/useTouchInput";
import { useIsMobile } from "../hooks/use-is-mobile";

interface TouchControlsProps {
  onMove: (direction: { x: number; z: number }) => void;
  onJump: () => void;
  onInteract: () => void;
}

export default function TouchControls({ onMove, onJump, onInteract }: TouchControlsProps) {
  const { gamePhase } = useFrequencyGame();
  const { setTouchMovement, triggerTouchJump, triggerTouchInteract, resetAllTouchInput } = useTouchInput();
  const isMobile = useIsMobile();
  const [activeDirection, setActiveDirection] = useState<{ x: number; z: number }>({ x: 0, z: 0 });


  // Check if we're in an iframe (embedded)
  const isEmbedded = typeof window !== 'undefined' ? window.self !== window.top : false;

  // Send movement updates to touch store
  useEffect(() => {
    setTouchMovement(activeDirection);
  }, [activeDirection, setTouchMovement]);



  // Simple approach: Use pointer events instead of touch events for better reliability
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      // Reset movement when any pointer is released
      setActiveDirection({ x: 0, z: 0 });
    };

    document.addEventListener('pointerup', handleGlobalPointerUp);
    document.addEventListener('pointercancel', handleGlobalPointerUp);
    
    return () => {
      document.removeEventListener('pointerup', handleGlobalPointerUp);
      document.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  // Reset touch input when game phase changes
  useEffect(() => {
    if (gamePhase !== "playing") {
      resetAllTouchInput();
      setActiveDirection({ x: 0, z: 0 });
    }
  }, [gamePhase, resetAllTouchInput]);

  // Don't show controls if not playing or not on mobile
  if (gamePhase !== "playing" || !isMobile) return null;

  const handleDirectionStart = (x: number, z: number) => {
    setActiveDirection({ x, z });
  };

  const handleDirectionEnd = () => {
    setActiveDirection({ x: 0, z: 0 });
  };

  const buttonStyle = "bg-black/60 text-white rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold border-2 border-white/30 active:bg-black/80 touch-manipulation select-none";
  const actionButtonStyle = "bg-green-600/80 text-white rounded-full w-16 h-16 flex items-center justify-center text-sm font-bold border-2 border-white/30 active:bg-green-700/80 touch-manipulation select-none";

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {/* Movement pad - bottom left */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="relative w-40 h-40">
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 rounded-full border-2 border-white/20"></div>
          
          {/* Up */}
          <button
            className={buttonStyle}
            style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}
            onPointerDown={(e) => {
              e.preventDefault();
              handleDirectionStart(0, -1);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleDirectionEnd();
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              handleDirectionEnd();
            }}
            onPointerLeave={(e) => {
              e.preventDefault();
              handleDirectionEnd();
            }}
            onMouseDown={() => handleDirectionStart(0, -1)}
            onMouseUp={handleDirectionEnd}
            onMouseLeave={handleDirectionEnd}
          >
            ↑
          </button>
          
          {/* Down */}
          <button
            className={buttonStyle}
            style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
            onPointerDown={(e) => {
              e.preventDefault();
              handleDirectionStart(0, 1);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleDirectionEnd();
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              handleDirectionEnd();
            }}
            onPointerLeave={(e) => {
              e.preventDefault();
              handleDirectionEnd();
            }}
            onMouseDown={() => handleDirectionStart(0, 1)}
            onMouseUp={handleDirectionEnd}
            onMouseLeave={handleDirectionEnd}
          >
            ↓
          </button>
          
          {/* Left */}
          <button
            className={buttonStyle}
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}
            onPointerDown={(e) => {
              e.preventDefault();
              handleDirectionStart(-1, 0);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleDirectionEnd();
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              handleDirectionEnd();
            }}
            onPointerLeave={(e) => {
              e.preventDefault();
              handleDirectionEnd();
            }}
            onMouseDown={() => handleDirectionStart(-1, 0)}
            onMouseUp={handleDirectionEnd}
            onMouseLeave={handleDirectionEnd}
          >
            ←
          </button>
          
          {/* Right */}
          <button
            className={buttonStyle}
            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
            onPointerDown={(e) => {
              e.preventDefault();
              handleDirectionStart(1, 0);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleDirectionEnd();
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              handleDirectionEnd();
            }}
            onPointerLeave={(e) => {
              e.preventDefault();
              handleDirectionEnd();
            }}
            onMouseDown={() => handleDirectionStart(1, 0)}
            onMouseUp={handleDirectionEnd}
            onMouseLeave={handleDirectionEnd}
          >
            →
          </button>
        </div>
      </div>

      {/* Action buttons - bottom right */}
      <div className="absolute bottom-4 right-4 pointer-events-auto flex flex-col space-y-3">
        {/* Jump button */}
        <button
          className={actionButtonStyle}
          onTouchStart={triggerTouchJump}
          onMouseDown={triggerTouchJump}
        >
          JUMP
        </button>
        

      </div>
    </div>
  );
}