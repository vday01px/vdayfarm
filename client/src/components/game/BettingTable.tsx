import { motion } from "framer-motion";
import { useGameStore, formatCurrency, type BetSide } from "@/lib/gameStore";
import { DiceGroup } from "./Dice";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BettingSectionProps {
  side: BetSide;
  label: string;
  totalBet: number;
  onSelect: () => void;
  isSelected: boolean;
  isDisabled: boolean;
}

function BettingSection({
  side,
  label,
  totalBet,
  onSelect,
  isSelected,
  isDisabled,
}: BettingSectionProps) {
  const Icon = side === "tai" ? TrendingUp : TrendingDown;
  const colorClasses = side === "tai" 
    ? "from-red-600/90 to-red-800/90 border-red-400" 
    : "from-blue-600/90 to-blue-800/90 border-blue-400";

  return (
    <motion.div
      className={cn(
        "relative flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all",
        "bg-gradient-to-b",
        colorClasses,
        isSelected && "ring-2 ring-casino-gold ring-offset-2 ring-offset-background",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !isDisabled && onSelect()}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      data-testid={`betting-section-${side}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-6 h-6 text-white" />
          <span className="text-2xl font-bold text-white uppercase tracking-wide">
            {label}
          </span>
          <span className="text-xs text-white/70 font-mono">
            {side === "tai" ? "11-18" : "3-10"}
          </span>
        </div>
        <div className="text-lg font-mono text-casino-gold font-semibold">
          {formatCurrency(totalBet)}
        </div>
        <Button
          variant="secondary"
          className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
          disabled={isDisabled}
          data-testid={`button-bet-${side}`}
        >
          Đặt Cược
        </Button>
      </div>
    </motion.div>
  );
}

export function BettingTable() {
  const {
    currentGame,
    selectedSide,
    setSelectedSide,
    betAmount,
    addToBetAmount,
    selectedChip,
    isRolling,
  } = useGameStore();

  const dice: [number, number, number] = currentGame?.dice1 && currentGame?.dice2 && currentGame?.dice3
    ? [currentGame.dice1, currentGame.dice2, currentGame.dice3]
    : [1, 1, 1];

  const total = currentGame?.total || 0;
  const taiTotal = 0;
  const xiuTotal = 0;
  const gameStatus = currentGame?.status || "waiting";
  const isBettingDisabled = gameStatus !== "waiting";

  const handleSelectSide = (side: BetSide) => {
    if (selectedSide === side) {
      addToBetAmount(selectedChip);
    } else {
      setSelectedSide(side);
      addToBetAmount(selectedChip);
    }
  };

  return (
    <div 
      className="relative p-4 rounded-xl border-2 border-casino-gold/50 bg-gradient-to-b from-card to-background"
      data-testid="betting-table"
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-casino-gold/5 to-transparent pointer-events-none" />
      
      <div className="relative flex gap-4 mb-4">
        <BettingSection
          side="tai"
          label="Tài"
          totalBet={taiTotal + (selectedSide === "tai" ? betAmount : 0)}
          onSelect={() => handleSelectSide("tai")}
          isSelected={selectedSide === "tai"}
          isDisabled={isBettingDisabled}
        />
        
        <div className="flex flex-col items-center justify-center">
          <motion.div
            className={cn(
              "w-24 h-24 rounded-full flex flex-col items-center justify-center",
              "bg-gradient-to-b from-casino-gold to-casino-gold-dark",
              "border-4 border-casino-gold-light shadow-lg"
            )}
            animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
            transition={isRolling ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
            data-testid="result-circle"
          >
            {gameStatus === "rolling" || isRolling ? (
              <div className="text-sm font-bold text-accent-foreground">Đang quay...</div>
            ) : (
              <>
                <DiceGroup dice={dice} isRolling={isRolling} size="sm" />
                <span className="text-2xl font-bold text-accent-foreground font-mono mt-1">
                  {total || "?"}
                </span>
              </>
            )}
          </motion.div>
        </div>
        
        <BettingSection
          side="xiu"
          label="Xỉu"
          totalBet={xiuTotal + (selectedSide === "xiu" ? betAmount : 0)}
          onSelect={() => handleSelectSide("xiu")}
          isSelected={selectedSide === "xiu"}
          isDisabled={isBettingDisabled}
        />
      </div>

      {selectedSide && betAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-muted-foreground mb-2"
          data-testid="selected-bet-info"
        >
          Đã chọn: <span className="text-casino-gold font-semibold uppercase">{selectedSide === "tai" ? "Tài" : "Xỉu"}</span>
          {" - "}
          <span className="text-foreground font-mono">{formatCurrency(betAmount)}</span>
        </motion.div>
      )}
    </div>
  );
}
