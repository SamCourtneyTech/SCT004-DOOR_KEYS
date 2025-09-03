import { useState, useEffect } from "react";
import { useFrequencyGame } from "../lib/stores/useFrequencyGame";
import { filterProfanity } from "../lib/profanityFilter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface HighScore {
  name: string;
  score: number;
  level: number;
  date: string;
}

export default function Scoreboard() {
  const { score, currentLevel, setGamePhase } = useFrequencyGame();
  const [playerName, setPlayerName] = useState("");
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [nameSubmitted, setNameSubmitted] = useState(false);

  const queryClient = useQueryClient();

  // Fetch global high scores from API
  const { data: globalHighScores, isLoading, error } = useQuery({
    queryKey: ["highScores"],
    queryFn: async (): Promise<HighScore[]> => {
      const response = await fetch("/api/highscores");
      if (!response.ok) throw new Error("Failed to fetch high scores");
      return await response.json();
    },
    retry: 2,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Mutation to add a new high score
  const addScoreMutation = useMutation({
    mutationFn: async (scoreData: { name: string; score: number; level: number }) => {
      const response = await fetch("/api/highscores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scoreData)
      });
      if (!response.ok) throw new Error("Failed to add high score");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["highScores"] });
      setNameSubmitted(true);
    }
  });

  // Load local scores as fallback
  useEffect(() => {
    const savedScores = localStorage.getItem("frequencyGameHighScores");
    if (savedScores) {
      setHighScores(JSON.parse(savedScores));
    }
  }, []);

  useEffect(() => {
    if (globalHighScores) {
      setHighScores(globalHighScores);
    }
  }, [globalHighScores]);

  const handleSubmitScore = () => {
    if (playerName.trim().length === 0) return;

    const filteredName = filterProfanity(playerName.trim());
    addScoreMutation.mutate({
      name: filteredName,
      score,
      level: currentLevel
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitScore();
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
      <div className="bg-black/95 text-white p-4 rounded-lg max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold mb-4 text-center text-yellow-400">Global High Scores</h2>
        
        {!nameSubmitted && (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg">
            <p className="text-base mb-2">Your Score: <span className="font-bold text-green-400">{score}</span></p>
            <p className="text-base mb-3">Level Reached: <span className="font-bold text-blue-400">{currentLevel}</span></p>
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Name for scoreboard"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 3))}
                onKeyPress={handleKeyPress}
                maxLength={3}
                className="w-full px-2 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-center text-base font-mono tracking-widest"
              />
              <p className="text-xs text-gray-400 text-center">3 characters max</p>
              <button
                onClick={handleSubmitScore}
                disabled={playerName.trim().length === 0 || addScoreMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-2 rounded transition-colors text-sm"
              >
                {addScoreMutation.isPending ? "Submitting..." : "Submit to Global Leaderboard"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {isLoading ? (
            <p className="text-center text-gray-400">Loading global high scores...</p>
          ) : error ? (
            <p className="text-center text-red-400">Failed to load global scores. Showing local scores.</p>
          ) : highScores.length === 0 ? (
            <p className="text-center text-gray-400">No high scores yet! Be the first!</p>
          ) : (
            highScores.slice(0, 5).map((score, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-2 rounded ${
                  index === 0 ? 'bg-yellow-900/50' : 
                  index === 1 ? 'bg-gray-700/50' : 
                  index === 2 ? 'bg-orange-900/50' : 'bg-gray-800/30'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base min-w-[1.5rem]">#{index + 1}</span>
                  <span className="font-semibold text-sm">{score.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-400 text-sm">{score.score} pts</div>
                  <div className="text-xs text-gray-400">Level {score.level}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setGamePhase('menu')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
