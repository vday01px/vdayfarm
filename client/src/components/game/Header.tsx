import { Menu, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore, formatCurrency } from "@/lib/gameStore";

export function Header() {
  const { user, setMenuOpen } = useGameStore();
  const balance = parseFloat(user?.balance?.toString() || "0");
  const username = user?.username || "Guest";
  const displayName = username.length > 12 ? username.slice(0, 12) + "..." : username;

  return (
    <header 
      className="sticky top-0 z-50 flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-card via-background to-card border-b border-casino-gold/30"
      data-testid="header"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMenuOpen(true)}
        className="text-casino-gold hover:text-casino-gold-light hover:bg-casino-gold/10"
        data-testid="button-menu"
      >
        <Menu className="w-6 h-6" />
      </Button>

      <div className="flex-1 text-center">
        <h1 className="text-lg font-bold text-casino-gold tracking-wide font-mono uppercase">
          Tài Xỉu
        </h1>
      </div>

      <div className="flex items-center gap-2" data-testid="user-info">
        <div className="text-right">
          <div className="text-xs text-muted-foreground truncate max-w-[80px]">
            {displayName}
          </div>
          <div className="flex items-center gap-1 text-casino-gold font-mono font-semibold">
            <Coins className="w-4 h-4" />
            <span data-testid="balance-display">{formatCurrency(balance)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
