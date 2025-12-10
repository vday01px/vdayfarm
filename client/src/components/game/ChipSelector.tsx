import { CHIP_VALUES, formatCurrency, useGameStore } from "@/lib/gameStore";
import { cn } from "@/lib/utils";

export function ChipSelector() {
  const { selectedChip, setSelectedChip } = useGameStore();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 p-3" data-testid="chip-selector">
      {CHIP_VALUES.map((value) => (
        <button
          key={value}
          onClick={() => setSelectedChip(value)}
          className={cn(
            "relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200",
            "bg-gradient-to-b shadow-lg border-2",
            selectedChip === value
              ? "from-casino-gold to-casino-gold-dark border-white scale-110 ring-2 ring-casino-gold-light"
              : "from-secondary to-muted border-border hover:scale-105"
          )}
          data-testid={`chip-${value}`}
        >
          <span
            className={cn(
              "font-mono",
              selectedChip === value ? "text-accent-foreground" : "text-foreground"
            )}
          >
            {formatCurrency(value)}
          </span>
          <div className="absolute inset-1 rounded-full border border-white/20 pointer-events-none" />
          <div className="absolute inset-2 rounded-full border border-white/10 pointer-events-none" />
        </button>
      ))}
    </div>
  );
}
