import { useEffect, useState } from "react";
import GameScene from "./GameScene";
import SimpleGameScene from "./SimpleGameScene";
import GameUI from "./GameUI";
import Scoreboard from "./Scoreboard";
import AudioManager from "./AudioManager";
import { useFrequencyGame } from "../lib/stores/useFrequencyGame";

// Simple mobile detection
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export default function Game() {
  const { gamePhase, initializeGame } = useFrequencyGame();
  const [isMobile] = useState(isMobileDevice);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  console.log("Game component rendering, mobile:", isMobile, "phase:", gamePhase);

  return (
    <>
      {isMobile ? <SimpleGameScene /> : <GameScene />}
      <AudioManager />
    </>
  );
}
