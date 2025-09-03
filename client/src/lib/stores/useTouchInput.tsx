import { create } from "zustand";

interface TouchInputState {
  touchMovement: { x: number; z: number };
  touchJumpPressed: boolean;
  touchInteractPressed: boolean;
  
  // Actions
  setTouchMovement: (direction: { x: number; z: number }) => void;
  triggerTouchJump: () => void;
  triggerTouchInteract: () => void;
  resetTouchJump: () => void;
  resetTouchInteract: () => void;
  resetAllTouchInput: () => void;
}

export const useTouchInput = create<TouchInputState>((set, get) => ({
  touchMovement: { x: 0, z: 0 },
  touchJumpPressed: false,
  touchInteractPressed: false,
  
  setTouchMovement: (direction) => set({ touchMovement: direction }),
  
  triggerTouchJump: () => {
    set({ touchJumpPressed: true });
    // Auto-reset after a short delay
    setTimeout(() => {
      set({ touchJumpPressed: false });
    }, 100);
  },
  
  triggerTouchInteract: () => {
    set({ touchInteractPressed: true });
    // Auto-reset after a short delay
    setTimeout(() => {
      set({ touchInteractPressed: false });
    }, 100);
  },
  
  resetTouchJump: () => set({ touchJumpPressed: false }),
  resetTouchInteract: () => set({ touchInteractPressed: false }),
  resetAllTouchInput: () => set({ 
    touchMovement: { x: 0, z: 0 },
    touchJumpPressed: false,
    touchInteractPressed: false 
  }),
}));