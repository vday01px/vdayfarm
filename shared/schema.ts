
import { pgTable, text, integer, boolean, timestamp, pgEnum, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const gameStatusEnum = pgEnum("game_status", ["waiting", "rolling", "finished"]);
export const betTypeEnum = pgEnum("bet_type", ["tai", "xiu"]);

// Users table
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("1000.00"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Games table
export const games = pgTable("games", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  dice1: integer("dice1"),
  dice2: integer("dice2"),
  dice3: integer("dice3"),
  total: integer("total"),
  result: text("result"), // "tai" or "xiu"
  status: gameStatusEnum("status").notNull().default("waiting"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bets table
export const bets = pgTable("bets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameId: integer("game_id").notNull().references(() => games.id),
  betType: betTypeEnum("bet_type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  payout: decimal("payout", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Giftcodes table
export const giftcodes = pgTable("giftcodes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: text("code").notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses").notNull().default(1),
  currentUses: integer("current_uses").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Giftcode redemptions table
export const giftcodeRedemptions = pgTable("giftcode_redemptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  giftcodeId: integer("giftcode_id").notNull().references(() => giftcodes.id),
  redeemedAt: timestamp("redeemed_at").notNull().defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertGameSchema = createInsertSchema(games);
export const selectGameSchema = createSelectSchema(games);
export const insertBetSchema = createInsertSchema(bets);
export const selectBetSchema = createSelectSchema(bets);
export const insertGiftcodeSchema = createInsertSchema(giftcodes);
export const selectGiftcodeSchema = createSelectSchema(giftcodes);

export type User = z.infer<typeof selectUserSchema>;
export type Game = z.infer<typeof selectGameSchema>;
export type Bet = z.infer<typeof selectBetSchema>;
export type Giftcode = z.infer<typeof selectGiftcodeSchema>;
export type BetWithUser = Bet & { user: User };
export type GameSettings = {
  autoRollEnabled: boolean;
  autoRollInterval: number;
  minBet: string;
  maxBet: string;
};
