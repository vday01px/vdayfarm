
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    const telegramId = req.headers["x-telegram-user-id"];
    if (!telegramId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let user = await storage.getUserByTelegramId(telegramId as string);
    if (!user) {
      // Create new user
      user = await storage.createUser({
        telegramId: telegramId as string,
        username: req.headers["x-telegram-username"] as string,
        firstName: req.headers["x-telegram-first-name"] as string,
        lastName: req.headers["x-telegram-last-name"] as string,
      });
    }

    req.user = user;
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // Auth routes
  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    res.json(req.user);
  });

  // Game routes
  app.get("/api/games/current", async (_req, res) => {
    try {
      const game = await storage.getCurrentGame();
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Error fetching current game" });
    }
  });

  app.get("/api/games/history", async (_req, res) => {
    try {
      const games = await storage.getRecentGames(20);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Error fetching game history" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGameById(parseInt(req.params.id));
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Error fetching game" });
    }
  });

  // Bet routes
  app.post("/api/bets", requireAuth, async (req: any, res) => {
    try {
      const schema = z.object({
        gameId: z.number(),
        betType: z.enum(["tai", "xiu"]),
        amount: z.string(),
      });

      const { gameId, betType, amount } = schema.parse(req.body);
      const user = req.user;

      // Check balance
      if (parseFloat(user.balance) < parseFloat(amount)) {
        return res.status(400).json({ message: "Số dư không đủ" });
      }

      // Check game status
      const game = await storage.getGameById(gameId);
      if (!game || game.status !== "waiting") {
        return res.status(400).json({ message: "Không thể đặt cược lúc này" });
      }

      // Deduct balance
      await storage.updateUserBalance(user.id, `-${amount}`);

      // Create bet
      const bet = await storage.createBet({
        userId: user.id,
        gameId,
        betType,
        amount,
      });

      res.json(bet);
    } catch (error) {
      res.status(400).json({ message: "Error creating bet" });
    }
  });

  app.get("/api/games/current/bets", async (_req, res) => {
    try {
      const game = await storage.getCurrentGame();
      if (!game) {
        return res.json([]);
      }
      const bets = await storage.getBetsByGameId(game.id);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching bets" });
    }
  });

  // Giftcode routes
  app.post("/api/giftcodes/redeem", requireAuth, async (req: any, res) => {
    try {
      const schema = z.object({
        code: z.string(),
      });

      const { code } = schema.parse(req.body);
      const result = await storage.redeemGiftcode(req.user.id, code);
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Error redeeming giftcode" });
    }
  });

  // Admin routes
  app.post("/api/admin/games/roll", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const currentGame = await storage.getCurrentGame();
      if (!currentGame) {
        return res.status(400).json({ message: "No active game" });
      }

      // Set to rolling
      await storage.updateGameStatus(currentGame.id, "rolling");

      // Roll dice
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const dice3 = Math.floor(Math.random() * 6) + 1;

      // Set result
      const game = await storage.setGameResult(currentGame.id, dice1, dice2, dice3);

      // Process bets
      await storage.processBetsForGame(currentGame.id);

      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Error rolling dice" });
    }
  });

  app.post("/api/admin/games/manual-result", requireAuth, requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        dice1: z.number().min(1).max(6),
        dice2: z.number().min(1).max(6),
        dice3: z.number().min(1).max(6),
      });

      const { dice1, dice2, dice3 } = schema.parse(req.body);
      const currentGame = await storage.getCurrentGame();
      
      if (!currentGame) {
        return res.status(400).json({ message: "No active game" });
      }

      await storage.updateGameStatus(currentGame.id, "rolling");
      const game = await storage.setGameResult(currentGame.id, dice1, dice2, dice3);
      await storage.processBetsForGame(currentGame.id);

      res.json(game);
    } catch (error) {
      res.status(400).json({ message: "Error setting manual result" });
    }
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.post("/api/admin/giftcodes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        code: z.string(),
        amount: z.string(),
        maxUses: z.number().default(1),
        expiresAt: z.string().optional(),
      });

      const data = schema.parse(req.body);
      const giftcode = await storage.createGiftcode({
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      });

      res.json(giftcode);
    } catch (error) {
      res.status(400).json({ message: "Error creating giftcode" });
    }
  });

  app.get("/api/admin/giftcodes", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const giftcodes = await storage.getAllGiftcodes();
      res.json(giftcodes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching giftcodes" });
    }
  });

  app.delete("/api/admin/giftcodes/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteGiftcode(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting giftcode" });
    }
  });

  return httpServer;
}
