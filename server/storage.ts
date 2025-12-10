import {
  users,
  games,
  bets,
  giftcodes,
  giftcodeRedemptions,
  transactions,
  gameSettings,
  type User,
  type InsertUser,
  type Game,
  type Bet,
  type InsertBet,
  type Giftcode,
  type InsertGiftcode,
  type GiftcodeRedemption,
  type Transaction,
  type InsertTransaction,
  type GameSettings,
  type BetWithUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(filter?: { fromDate?: Date }): Promise<User[]>;

  getCurrentGame(): Promise<Game | undefined>;
  createGame(roundNumber: number): Promise<Game>;
  updateGame(id: string, data: Partial<Game>): Promise<Game | undefined>;
  getRecentGames(limit: number): Promise<Game[]>;

  createBet(bet: InsertBet & { userId: string; gameId: string }): Promise<Bet>;
  getBetsByGameId(gameId: string): Promise<BetWithUser[]>;
  updateBet(id: string, data: Partial<Bet>): Promise<Bet | undefined>;

  createGiftcode(giftcode: InsertGiftcode): Promise<Giftcode>;
  getGiftcodeByCode(code: string): Promise<Giftcode | undefined>;
  getAllGiftcodes(): Promise<Giftcode[]>;
  updateGiftcode(id: string, data: Partial<Giftcode>): Promise<Giftcode | undefined>;
  deleteGiftcode(id: string): Promise<void>;

  createGiftcodeRedemption(redemption: {
    giftcodeId: string;
    userId: string;
    amountReceived: string;
    requiredBet: string;
  }): Promise<GiftcodeRedemption>;
  getRedemptionsByUserId(userId: string): Promise<GiftcodeRedemption[]>;

  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;

  getSettings(): Promise<GameSettings | undefined>;
  updateSettings(data: Partial<GameSettings>): Promise<GameSettings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAllUsers(filter?: { fromDate?: Date }): Promise<User[]> {
    if (filter?.fromDate) {
      return db.select().from(users).where(gte(users.createdAt, filter.fromDate)).orderBy(desc(users.createdAt));
    }
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getCurrentGame(): Promise<Game | undefined> {
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.status, "betting"))
      .orderBy(desc(games.createdAt))
      .limit(1);
    
    if (game) return game;

    const [latestGame] = await db
      .select()
      .from(games)
      .orderBy(desc(games.createdAt))
      .limit(1);
    
    return latestGame || undefined;
  }

  async createGame(roundNumber: number): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values({ roundNumber, status: "betting" })
      .returning();
    return game;
  }

  async updateGame(id: string, data: Partial<Game>): Promise<Game | undefined> {
    const [game] = await db.update(games).set(data).where(eq(games.id, id)).returning();
    return game || undefined;
  }

  async getRecentGames(limit: number): Promise<Game[]> {
    return db
      .select()
      .from(games)
      .where(eq(games.status, "finished"))
      .orderBy(desc(games.createdAt))
      .limit(limit);
  }

  async createBet(bet: InsertBet & { userId: string; gameId: string }): Promise<Bet> {
    const [newBet] = await db.insert(bets).values(bet).returning();
    return newBet;
  }

  async getBetsByGameId(gameId: string): Promise<BetWithUser[]> {
    const result = await db
      .select()
      .from(bets)
      .leftJoin(users, eq(bets.userId, users.id))
      .where(eq(bets.gameId, gameId));
    
    return result.map((r) => ({
      ...r.bets,
      user: r.users!,
    }));
  }

  async updateBet(id: string, data: Partial<Bet>): Promise<Bet | undefined> {
    const [bet] = await db.update(bets).set(data).where(eq(bets.id, id)).returning();
    return bet || undefined;
  }

  async createGiftcode(giftcode: InsertGiftcode): Promise<Giftcode> {
    const [gc] = await db.insert(giftcodes).values(giftcode).returning();
    return gc;
  }

  async getGiftcodeByCode(code: string): Promise<Giftcode | undefined> {
    const [gc] = await db.select().from(giftcodes).where(eq(giftcodes.code, code));
    return gc || undefined;
  }

  async getAllGiftcodes(): Promise<Giftcode[]> {
    return db.select().from(giftcodes).orderBy(desc(giftcodes.createdAt));
  }

  async updateGiftcode(id: string, data: Partial<Giftcode>): Promise<Giftcode | undefined> {
    const [gc] = await db.update(giftcodes).set(data).where(eq(giftcodes.id, id)).returning();
    return gc || undefined;
  }

  async deleteGiftcode(id: string): Promise<void> {
    await db.delete(giftcodes).where(eq(giftcodes.id, id));
  }

  async createGiftcodeRedemption(redemption: {
    giftcodeId: string;
    userId: string;
    amountReceived: string;
    requiredBet: string;
  }): Promise<GiftcodeRedemption> {
    const [r] = await db.insert(giftcodeRedemptions).values(redemption).returning();
    return r;
  }

  async getRedemptionsByUserId(userId: string): Promise<GiftcodeRedemption[]> {
    return db.select().from(giftcodeRedemptions).where(eq(giftcodeRedemptions.userId, userId));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [t] = await db.insert(transactions).values(transaction).returning();
    return t;
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async getSettings(): Promise<GameSettings | undefined> {
    const [settings] = await db.select().from(gameSettings).where(eq(gameSettings.id, "default"));
    return settings || undefined;
  }

  async updateSettings(data: Partial<GameSettings>): Promise<GameSettings> {
    const existing = await this.getSettings();
    if (existing) {
      const [settings] = await db
        .update(gameSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(gameSettings.id, "default"))
        .returning();
      return settings;
    } else {
      const [settings] = await db
        .insert(gameSettings)
        .values({ id: "default", ...data })
        .returning();
      return settings;
    }
  }
}

export const storage = new DatabaseStorage();
