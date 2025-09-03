import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getHighScores, addHighScore, getOrCreateHighScoresDatabase, NOTION_DATABASE_ID } from "./notion";

export async function registerRoutes(app: Express): Promise<Server> {
  // High scores API routes
  app.get("/api/highscores", async (req, res) => {
    try {
      await getOrCreateHighScoresDatabase();
      const scores = await getHighScores(NOTION_DATABASE_ID);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching high scores:", error);
      res.status(500).json({ error: "Failed to fetch high scores" });
    }
  });

  app.post("/api/highscores", async (req, res) => {
    try {
      const { name, score, level } = req.body;
      
      if (!name || typeof score !== 'number' || typeof level !== 'number') {
        return res.status(400).json({ error: "Invalid data" });
      }

      await getOrCreateHighScoresDatabase();
      await addHighScore(NOTION_DATABASE_ID, name, score, level);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding high score:", error);
      res.status(500).json({ error: "Failed to add high score" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
