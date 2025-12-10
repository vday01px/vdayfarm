
import { db } from "./db";
import { users, games, bets, giftcodes, giftcodeRedemptions, type User, type Game, type Bet, type Giftcode } from "../shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const storage = {
  // User operations
  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  },

  async createUser(userData: typeof users.$inferInsert): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },

  async updateUserBalance(userId: number, amount: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  },

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  },

  // Game operations
  async getCurrentGame(): Promise<Game | undefined> {
    // First try to get a waiting game
    const [waitingGame] = await db
      .select()
      .from(games)
      .where(eq(games.status, "waiting"))
      .orderBy(desc(games.createdAt))
      .limit(1);
    
    if (waitingGame) return waitingGame;
    
    // Then try to get the most recent finished game (for showing results)
    const [finishedGame] = await db
      .select()
      .from(games)
      .where(eq(games.status, "finished"))
      .orderBy(desc(games.createdAt))
      .limit(1);
    
    if (finishedGame) return finishedGame;
    
    // Create new game if none exists
    const [newGame] = await db.insert(games).values({
      status: "waiting",
      startTime: new Date(),
    }).returning();
    return newGame;
  },

  async getGameById(gameId: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, gameId));
    return game;
  },

  async updateGameStatus(gameId: number, status: "waiting" | "rolling" | "finished"): Promise<Game> {
    const [game] = await db
      .update(games)
      .set({ status })
      .where(eq(games.id, gameId))
      .returning();
    return game;
  },

  async setGameResult(gameId: number, dice1: number, dice2: number, dice3: number): Promise<Game> {
    const total = dice1 + dice2 + dice3;
    const result = total >= 11 ? "tai" : "xiu";
    
    const [game] = await db
      .update(games)
      .set({
        dice1,
        dice2,
        dice3,
        total,
        result,
        status: "finished",
        endTime: new Date(),
      })
      .where(eq(games.id, gameId))
      .returning();
    
    return game;
  },

  async getRecentGames(limit: number = 10): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(eq(games.status, "finished"))
      .orderBy(desc(games.createdAt))
      .limit(limit);
  },

  async createNewGame(): Promise<Game> {
    const [newGame] = await db.insert(games).values({
      status: "waiting",
      startTime: new Date(),
    }).returning();
    return newGame;
  },

  // Bet operations
  async createBet(betData: typeof bets.$inferInsert): Promise<Bet> {
    const [bet] = await db.insert(bets).values(betData).returning();
    return bet;
  },

  async getBetsByGameId(gameId: number): Promise<(Bet & { user: User })[]> {
    return await db
      .select({
        id: bets.id,
        userId: bets.userId,
        gameId: bets.gameId,
        betType: bets.betType,
        amount: bets.amount,
        payout: bets.payout,
        createdAt: bets.createdAt,
        user: users,
      })
      .from(bets)
      .innerJoin(users, eq(bets.userId, users.id))
      .where(eq(bets.gameId, gameId))
      .orderBy(desc(bets.createdAt));
  },

  async updateBetPayout(betId: number, payout: string): Promise<Bet> {
    const [bet] = await db
      .update(bets)
      .set({ payout })
      .where(eq(bets.id, betId))
      .returning();
    return bet;
  },

  async processBetsForGame(gameId: number): Promise<void> {
    const game = await this.getGameById(gameId);
    if (!game || !game.result) return;

    const gameBets = await db.select().from(bets).where(eq(bets.gameId, gameId));

    for (const bet of gameBets) {
      if (bet.betType === game.result) {
        // Win: payout = bet amount * 1.95
        const payout = (parseFloat(bet.amount) * 1.95).toFixed(2);
        await this.updateBetPayout(bet.id, payout);
        await this.updateUserBalance(bet.userId, payout);
      } else {
        // Lose: payout = 0
        await this.updateBetPayout(bet.id, "0");
      }
    }
  },

  // Giftcode operations
  async createGiftcode(giftcodeData: typeof giftcodes.$inferInsert): Promise<Giftcode> {
    const [giftcode] = await db.insert(giftcodes).values(giftcodeData).returning();
    return giftcode;
  },

  async getGiftcodeByCode(code: string): Promise<Giftcode | undefined> {
    const [giftcode] = await db.select().from(giftcodes).where(eq(giftcodes.code, code));
    return giftcode;
  },

  async redeemGiftcode(userId: number, code: string): Promise<{ success: boolean; message: string; amount?: string }> {
    const giftcode = await this.getGiftcodeByCode(code);
    
    if (!giftcode) {
      return { success: false, message: "Mã quà tặng không tồn tại" };
    }

    if (!giftcode.isActive) {
      return { success: false, message: "Mã quà tặng đã bị vô hiệu hóa" };
    }

    if (giftcode.expiresAt && new Date(giftcode.expiresAt) < new Date()) {
      return { success: false, message: "Mã quà tặng đã hết hạn" };
    }

    if (giftcode.currentUses >= giftcode.maxUses) {
      return { success: false, message: "Mã quà tặng đã hết lượt sử dụng" };
    }

    // Check if user already redeemed
    const [existing] = await db
      .select()
      .from(giftcodeRedemptions)
      .where(
        and(
          eq(giftcodeRedemptions.userId, userId),
          eq(giftcodeRedemptions.giftcodeId, giftcode.id)
        )
      );

    if (existing) {
      return { success: false, message: "Bạn đã sử dụng mã này rồi" };
    }

    // Redeem giftcode
    await db.insert(giftcodeRedemptions).values({
      userId,
      giftcodeId: giftcode.id,
    });

    await db
      .update(giftcodes)
      .set({ currentUses: sql`${giftcodes.currentUses} + 1` })
      .where(eq(giftcodes.id, giftcode.id));

    await this.updateUserBalance(userId, giftcode.amount);

    return { success: true, message: "Nhận quà thành công!", amount: giftcode.amount };
  },

  async getAllGiftcodes(): Promise<Giftcode[]> {
    return await db.select().from(giftcodes).orderBy(desc(giftcodes.createdAt));
  },

  async deleteGiftcode(giftcodeId: number): Promise<void> {
    await db.delete(giftcodes).where(eq(giftcodes.id, giftcodeId));
  },
};
