import { useGameStore, formatCurrency } from "@/lib/gameStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users } from "lucide-react";

export function BettingPlayersList() {
  const { bets } = useGameStore();

  const taiBets = bets.filter((bet) => bet.side === "tai");
  const xiuBets = bets.filter((bet) => bet.side === "xiu");

  const PlayerList = ({
    title,
    players,
    side,
  }: {
    title: string;
    players: typeof bets;
    side: "tai" | "xiu";
  }) => (
    <div className="flex-1 min-w-0">
      <div
        className={`flex items-center gap-2 p-2 rounded-t-lg ${
          side === "tai" ? "bg-tai/20" : "bg-xiu/20"
        }`}
      >
        <Users className="w-4 h-4" />
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">({players.length})</span>
      </div>
      <ScrollArea className="h-32 rounded-b-lg border border-t-0 border-border bg-card/50">
        {players.length === 0 ? (
          <div className="p-3 text-center text-xs text-muted-foreground">
            Chưa có người đặt
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {players.map((bet, index) => (
              <div
                key={bet.id || index}
                className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50"
                data-testid={`bet-player-${bet.user?.username || index}`}
              >
                <span className="truncate max-w-[80px]">
                  {bet.user?.username || "Ẩn danh"}
                </span>
                <span className="font-mono text-casino-gold">
                  {formatCurrency(bet.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <div className="p-3" data-testid="betting-players-list">
      <div className="flex gap-3">
        <PlayerList title="Tài" players={taiBets} side="tai" />
        <PlayerList title="Xỉu" players={xiuBets} side="xiu" />
      </div>
    </div>
  );
}
