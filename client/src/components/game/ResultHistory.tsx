import { useGameStore, type BetSide } from "@/lib/gameStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function ResultHistory() {
  const { resultHistory, countdown, currentGame } = useGameStore();
  const gameStatus = currentGame?.status || "betting";

  return (
    <div className="p-4" data-testid="result-history">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Dãy thắng:</span>
          <span className="font-mono text-foreground">
            {resultHistory.filter((r) => r.result === "tai").length.toString().padStart(2, "0")}
          </span>
        </div>
        
        <div className="relative">
          <motion.div
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              "bg-gradient-to-b from-casino-gold to-casino-gold-dark",
              "border-2 border-casino-gold-light font-mono text-xl font-bold text-accent-foreground"
            )}
            animate={
              gameStatus === "betting"
                ? { scale: [1, 1.05, 1] }
                : {}
            }
            transition={{ duration: 1, repeat: Infinity }}
            data-testid="countdown-timer"
          >
            {countdown}
          </motion.div>
          <svg
            className="absolute inset-0 w-14 h-14 -rotate-90"
            viewBox="0 0 56 56"
          >
            <circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="hsl(var(--casino-gold-light))"
              strokeWidth="3"
              strokeDasharray={`${(countdown / 30) * 163.36} 163.36`}
              strokeLinecap="round"
            />
          </svg>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Dãy thua:</span>
          <span className="font-mono text-foreground">
            {resultHistory.filter((r) => r.result === "xiu").length.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 overflow-x-auto py-2" data-testid="result-dots">
        {resultHistory.length === 0 ? (
          <span className="text-sm text-muted-foreground">Chưa có kết quả</span>
        ) : (
          resultHistory.map((result, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "w-3 h-3 rounded-full flex-shrink-0",
                result.result === "tai"
                  ? "bg-tai"
                  : "bg-xiu"
              )}
              title={`${result.result === "tai" ? "Tài" : "Xỉu"}: ${result.total}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
