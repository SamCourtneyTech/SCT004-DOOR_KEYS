import { useFrequencyGame } from "../lib/stores/useFrequencyGame";
import { useIsMobile } from "../hooks/use-is-mobile";

export default function GameUI() {
  const { 
    gamePhase, 
    currentLevel, 
    score, 
    currentFrequency,
    startGame,
    restartGame,
    endGame,
    resumeGame
  } = useFrequencyGame();
  const isMobile = useIsMobile();

  if (gamePhase === 'scoreboard') return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Debug info removed */}

      {/* Main game HUD */}
      {gamePhase === 'playing' && (
        <>
          {/* Top left - Score only */}
          <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg pointer-events-auto">
            <div className="text-lg">Score: {score}</div>
          </div>

          {/* Top right - Game controls */}
          <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg pointer-events-auto">
            <button 
              onClick={endGame}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors mr-2"
            >
              End Game
            </button>
          </div>




        </>
      )}

      {/* Pause screen */}
      {gamePhase === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="bg-black/90 text-white p-8 rounded-lg text-center max-w-md">
            <h1 className="text-4xl font-bold mb-4 text-yellow-400">Game Paused</h1>
            <div className="mb-6">
              <div className="text-lg mb-2">Level: {currentLevel}</div>
              <div className="text-lg mb-4">Score: {score}</div>
            </div>
            <div className="space-y-3">
              <button 
                onClick={resumeGame}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-xl font-bold pointer-events-auto transition-colors"
              >
                Resume Game
              </button>
              <button 
                onClick={endGame}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg text-xl font-bold pointer-events-auto transition-colors"
              >
                End Game
              </button>
            </div>
            <div className="text-sm text-gray-400 mt-4">Press P or ESC to resume</div>
          </div>
        </div>
      )}

      {/* Start screen */}
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-black/90 text-white p-8 rounded-lg text-center max-w-md mx-4">
            <h1 className="text-4xl font-bold mb-4 text-green-400">Frequency Doors</h1>
            <p className="text-lg mb-6">
              Listen to the frequency and walk through the matching door. 
              Wrong door = game over!
            </p>
            <button 
              onClick={() => {
                console.log("Start Game button clicked, current phase:", gamePhase);
                startGame();
                // Force a small delay to ensure state propagation
                setTimeout(() => {
                  console.log("Post-start game phase:", useFrequencyGame.getState().gamePhase);
                }, 100);
              }}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-8 py-3 rounded-lg text-xl font-bold pointer-events-auto transition-colors touch-manipulation select-none"
              style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
            >
              Start Game
            </button>
            <div className="text-xs text-gray-500 mt-2">Current: {gamePhase}</div>
          </div>
        </div>
      )}

      {/* Game over screen */}
      {gamePhase === 'gameOver' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-black/90 text-white p-8 rounded-lg text-center max-w-md">
            <h2 className="text-3xl font-bold mb-4 text-red-400">Game Over!</h2>
            <p className="text-lg mb-2">Final Score: <span className="font-bold text-green-400">{score}</span></p>
            <p className="text-lg mb-6">Level Reached: <span className="font-bold text-blue-400">{currentLevel}</span></p>
            <div className="space-y-3">
              <button 
                onClick={restartGame}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-xl font-bold pointer-events-auto transition-colors w-full"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
