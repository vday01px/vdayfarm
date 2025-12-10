import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const giftcodeConditionEnum = pgEnum("giftcode_condition", ["deposit", "bet", "both"]);
export const betSideEnum = pgEnum("bet_side", ["tai", "xiu"]);
export const gameStatusEnum = pgEnum("game_status", ["betting", "rolling", "finished"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  totalDeposit: decimal("total_deposit", { precision: 15, scale: 2 }).notNull().default("0"),
  totalWithdraw: decimal("total_withdraw", { precision: 15, scale: 2 }).notNull().default("0"),
  totalBet: decimal("total_bet", { precision: 15, scale: 2 }).notNull().default("0"),
  isLocked: boolean("is_locked").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  bets: many(bets),
  transactions: many(transactions),
  giftcodeRedemptions: many(giftcodeRedemptions),
}));

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundNumber: integer("round_number").notNull(),
  dice1: integer("dice_1"),
  dice2: integer("dice_2"),
  dice3: integer("dice_3"),
  total: integer("total"),
  result: betSideEnum("result"),
  status: gameStatusEnum("status").notNull().default("betting"),
  taiTotal: decimal("tai_total", { precision: 15, scale: 2 }).notNull().default("0"),
  xiuTotal: decimal("xiu_total", { precision: 15, scale: 2 }).notNull().default("0"),
  manualResult: betSideEnum("manual_result"),
  autoControlEnabled: boolean("auto_control_enabled").notNull().default(false),
  autoLosePercent: integer("auto_lose_percent").notNull().default(60),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
});

export const gamesRelations = relations(games, ({ many }) => ({
  bets: many(bets),
}));

export const bets = pgTable("bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  side: betSideEnum("side").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  payout: decimal("payout", { precision: 15, scale: 2 }),
  isWin: boolean("is_win"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const betsRelations = relations(bets, ({ one }) => ({
  game: one(games, {
    fields: [bets.gameId],
    references: [games.id],
  }),
  user: one(users, {
    fields: [bets.userId],
    references: [users.id],
  }),
}));

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const giftcodes = pgTable("giftcodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  maxUses: integer("max_uses").notNull().default(1),
  currentUses: integer("current_uses").notNull().default(0),
  condition: giftcodeConditionEnum("condition").notNull().default("deposit"),
  conditionAmount: decimal("condition_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  withdrawMultiplier: integer("withdraw_multiplier").notNull().default(2),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const giftcodesRelations = relations(giftcodes, ({ many }) => ({
  redemptions: many(giftcodeRedemptions),
}));

export const giftcodeRedemptions = pgTable("giftcode_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  giftcodeId: varchar("giftcode_id").notNull().references(() => giftcodes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amountReceived: decimal("amount_received", { precision: 15, scale: 2 }).notNull(),
  requiredBet: decimal("required_bet", { precision: 15, scale: 2 }).notNull(),
  currentBet: decimal("current_bet", { precision: 15, scale: 2 }).notNull().default("0"),
  canWithdraw: boolean("can_withdraw").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const giftcodeRedemptionsRelations = relations(giftcodeRedemptions, ({ one }) => ({
  giftcode: one(giftcodes, {
    fields: [giftcodeRedemptions.giftcodeId],
    references: [giftcodes.id],
  }),
  user: one(users, {
    fields: [giftcodeRedemptions.userId],
    references: [users.id],
  }),
}));

export const gameSettings = pgTable("game_settings", {
  id: varchar("id").primaryKey().default("default"),
  autoControlEnabled: boolean("auto_control_enabled").notNull().default(false),
  autoLosePercent: integer("auto_lose_percent").notNull().default(60),
  bettingDuration: integer("betting_duration").notNull().default(30),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  telegramId: true,
  username: true,
});

export const insertBetSchema = createInsertSchema(bets).pick({
  gameId: true,
  side: true,
  amount: true,
});

export const insertGiftcodeSchema = createInsertSchema(giftcodes).pick({
  code: true,
  amount: true,
  maxUses: true,
  condition: true,
  conditionAmount: true,
  withdrawMultiplier: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  type: true,
  amount: true,
  note: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof bets.$inferSelect;
export type Game = typeof games.$inferSelect;
export type InsertGiftcode = z.infer<typeof insertGiftcodeSchema>;
export type Giftcode = typeof giftcodes.$inferSelect;
export type GiftcodeRedemption = typeof giftcodeRedemptions.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type GameSettings = typeof gameSettings.$inferSelect;

export type BetWithUser = Bet & { user: User };
export type GameWithBets = Game & { bets: BetWithUser[] };
