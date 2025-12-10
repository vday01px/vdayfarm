import { create } from "zustand";
import type { User, Game, BetWithUser } from "@shared/schema";

export type BetSide = "tai" | "xiu";

interface GameState {
  user: User | null;
  currentGame: Game | null;
  bets: BetWithUser[];
  selectedChip: number;
  selectedSide: BetSide | null;
  betAmount: number;
  isRolling: boolean;
  countdown: number;
  waitCountdown: number;
  isManualMode: boolean;
  resultHistory: Array<{ result: BetSide; total: number; dice: [number, number, number]; gameId: number }>;
  isMenuOpen: boolean;
  activeModal: "deposit" | "withdraw" | "giftcode" | "locked" | "history" | "soicau" | null;

  setUser: (user: User | null) => void;
  setCurrentGame: (game: Game | null) => void;
  setBets: (bets: BetWithUser[]) => void;
  setSelectedChip: (chip: number) => void;
  setSelectedSide: (side: BetSide | null) => void;
  setBetAmount: (amount: number) => void;
  addToBetAmount: (amount: number) => void;
  setIsRolling: (rolling: boolean) => void;
  setCountdown: (countdown: number) => void;
  setWaitCountdown: (countdown: number) => void;
  setManualMode: (manual: boolean) => void;
  addResultToHistory: (result: BetSide, total: number, dice: [number, number, number], gameId: number) => void;
  setMenuOpen: (open: boolean) => void;
  setActiveModal: (modal: "deposit" | "withdraw" | "giftcode" | "locked" | "history" | "soicau" | null) => void;
  resetBet: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  user: null,
  currentGame: null,
  bets: [],
  selectedChip: 10,
  selectedSide: null,
  betAmount: 0,
  isRolling: false,
  countdown: 30,
  waitCountdown: 0,
  isManualMode: false,
  resultHistory: [],
  isMenuOpen: false,
  activeModal: null,

  setUser: (user) => set({ user }),
  setCurrentGame: (game) => set({ currentGame: game }),
  setBets: (bets) => set({ bets }),
  setSelectedChip: (chip) => set({ selectedChip: chip }),
  setSelectedSide: (side) => set({ selectedSide: side }),
  setBetAmount: (amount) => set({ betAmount: amount }),
  addToBetAmount: (amount) =>
    set((state) => ({ betAmount: state.betAmount + amount })),
  setIsRolling: (rolling) => set({ isRolling: rolling }),
  setCountdown: (countdown) => set({ countdown }),
  setWaitCountdown: (countdown) => set({ waitCountdown: countdown }),
  setManualMode: (manual) => set({ isManualMode: manual }),
  addResultToHistory: (result, total, dice, gameId) =>
    set((state) => ({
      resultHistory: [...state.resultHistory.slice(-49), { result, total, dice, gameId }],
    })),
  setMenuOpen: (open) => set({ isMenuOpen: open }),
  setActiveModal: (modal) => set({ activeModal: modal }),
  resetBet: () => set({ selectedSide: null, betAmount: 0 }),
}));

export const CHIP_VALUES = [10, 20, 50, 100, 200, 500];

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("vi-VN").format(num);
}

export function calculateTotalFromDice(dice1: number, dice2: number, dice3: number): number {
  return dice1 + dice2 + dice3;
}

export function getResultFromTotal(total: number): BetSide {
  return total >= 11 ? "tai" : "xiu";
}
