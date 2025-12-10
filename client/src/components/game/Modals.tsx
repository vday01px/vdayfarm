import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, ArrowDownToLine, Gift, AlertTriangle, History, TrendingUp, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameStore, formatCurrency, type BetSide } from "@/lib/gameStore";
import { openTelegramChat } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Game } from "@shared/schema";

function ModalWrapper({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  canClose = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: typeof Wallet;
  children: React.ReactNode;
  canClose?: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={canClose ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-card border border-card-border rounded-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-casino-gold/10 to-transparent">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-casino-gold" />
                <h3 className="text-lg font-bold text-foreground">{title}</h3>
              </div>
              {canClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function DepositModal() {
  const { activeModal, setActiveModal } = useGameStore();
  const isOpen = activeModal === "deposit";

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => setActiveModal(null)}
      title="Nạp tiền"
      icon={Wallet}
    >
      <div className="space-y-4" data-testid="deposit-modal">
        <p className="text-sm text-muted-foreground">
          Để nạp tiền, vui lòng liên hệ CSKH qua Telegram.
        </p>
        <Button
          className="w-full bg-casino-gold hover:bg-casino-gold-light text-accent-foreground"
          onClick={() => {
            openTelegramChat("vdaychim99");
            setActiveModal(null);
          }}
          data-testid="button-contact-deposit"
        >
          Liên hệ CSKH
        </Button>
      </div>
    </ModalWrapper>
  );
}

export function WithdrawModal() {
  const { activeModal, setActiveModal, user } = useGameStore();
  const isOpen = activeModal === "withdraw";
  const balance = parseFloat(user?.balance?.toString() || "0");

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => setActiveModal(null)}
      title="Rút tiền"
      icon={ArrowDownToLine}
    >
      <div className="space-y-4" data-testid="withdraw-modal">
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">Số dư hiện tại</div>
          <div className="text-xl font-bold text-casino-gold font-mono">
            {formatCurrency(balance)}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Để rút tiền, vui lòng liên hệ CSKH qua Telegram.
        </p>
        <Button
          className="w-full bg-casino-gold hover:bg-casino-gold-light text-accent-foreground"
          onClick={() => {
            openTelegramChat("vdaychim99");
            setActiveModal(null);
          }}
          data-testid="button-contact-withdraw"
        >
          Liên hệ CSKH
        </Button>
      </div>
    </ModalWrapper>
  );
}

export function GiftcodeModal() {
  const { activeModal, setActiveModal } = useGameStore();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isOpen = activeModal === "giftcode";

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã giftcode",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/giftcodes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể sử dụng giftcode");
      }

      toast({
        title: "Thành công!",
        description: `Đã nhận ${formatCurrency(data.amount)}`,
      });
      setCode("");
      setActiveModal(null);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => setActiveModal(null)}
      title="Nhập Giftcode"
      icon={Gift}
    >
      <div className="space-y-4" data-testid="giftcode-modal">
        <Input
          placeholder="Nhập mã giftcode"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="text-center font-mono text-lg tracking-wider"
          data-testid="input-giftcode"
        />
        <Button
          className="w-full bg-casino-gold hover:bg-casino-gold-light text-accent-foreground"
          onClick={handleRedeem}
          disabled={isLoading}
          data-testid="button-redeem-giftcode"
        >
          {isLoading ? "Đang xử lý..." : "Nhập code"}
        </Button>
      </div>
    </ModalWrapper>
  );
}

export function LockedAccountModal() {
  const { activeModal, setActiveModal } = useGameStore();
  const [countdown, setCountdown] = useState(5);
  const isOpen = activeModal === "locked";

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          openTelegramChat("vdaychim99");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {}}
      title="Tài khoản bị khóa"
      icon={AlertTriangle}
      canClose={false}
    >
      <div className="space-y-4 text-center" data-testid="locked-modal">
        <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-foreground">
          Tài khoản của bạn đã bị khóa. Vui lòng liên hệ CSKH để được hỗ trợ.
        </p>
        <p className="text-sm text-muted-foreground">
          Tự động chuyển hướng sau <span className="text-casino-gold font-bold">{countdown}</span> giây...
        </p>
        <Button
          className="w-full bg-casino-gold hover:bg-casino-gold-light text-accent-foreground"
          onClick={() => openTelegramChat("vdaychim99")}
          data-testid="button-contact-support"
        >
          Liên hệ CSKH ngay
        </Button>
      </div>
    </ModalWrapper>
  );
}

function DiceIcon({ value, className }: { value: number; className?: string }) {
  const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
  const Icon = icons[Math.min(Math.max(value - 1, 0), 5)];
  return <Icon className={className} />;
}

export function HistoryModal() {
  const { activeModal, setActiveModal, resultHistory } = useGameStore();
  const isOpen = activeModal === "history";

  const { data: serverHistory } = useQuery<Game[]>({
    queryKey: ["/api/games/history"],
    enabled: isOpen,
  });

  const displayHistory = serverHistory || resultHistory.map((r, i) => ({
    id: r.gameId,
    dice1: r.dice[0],
    dice2: r.dice[1],
    dice3: r.dice[2],
    total: r.total,
    result: r.result,
    createdAt: new Date().toISOString(),
  }));

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => setActiveModal(null)}
      title="Lịch sử kết quả"
      icon={History}
    >
      <div className="space-y-2 max-h-[60vh] overflow-y-auto" data-testid="history-modal">
        {displayHistory.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Chưa có lịch sử</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="text-left py-2 px-1 text-muted-foreground font-medium">Phiên</th>
                <th className="text-center py-2 px-1 text-muted-foreground font-medium">Xúc xắc</th>
                <th className="text-center py-2 px-1 text-muted-foreground font-medium">Tổng</th>
                <th className="text-right py-2 px-1 text-muted-foreground font-medium">Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {displayHistory.slice(0, 50).map((game, index) => (
                <tr 
                  key={game.id || index} 
                  className="border-b border-border/50"
                  data-testid={`history-row-${index}`}
                >
                  <td className="py-2 px-1 font-mono text-xs">#{game.id}</td>
                  <td className="py-2 px-1">
                    <div className="flex items-center justify-center gap-1">
                      <DiceIcon value={game.dice1 || 1} className="w-4 h-4" />
                      <DiceIcon value={game.dice2 || 1} className="w-4 h-4" />
                      <DiceIcon value={game.dice3 || 1} className="w-4 h-4" />
                    </div>
                  </td>
                  <td className="py-2 px-1 text-center font-mono font-bold">{game.total}</td>
                  <td className="py-2 px-1 text-right">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-bold uppercase",
                      game.result === "tai" ? "bg-tai/20 text-tai" : "bg-xiu/20 text-xiu"
                    )}>
                      {game.result === "tai" ? "Tài" : "Xỉu"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ModalWrapper>
  );
}

export function SoiCauModal() {
  const { activeModal, setActiveModal, resultHistory } = useGameStore();
  const isOpen = activeModal === "soicau";

  const { data: serverHistory } = useQuery<Game[]>({
    queryKey: ["/api/games/history"],
    enabled: isOpen,
  });

  const history = serverHistory?.map(g => ({
    result: g.result as BetSide,
    total: g.total || 0,
  })) || resultHistory;

  const taiCount = history.filter(r => r.result === "tai").length;
  const xiuCount = history.filter(r => r.result === "xiu").length;
  const totalGames = history.length;

  const taiPercentage = totalGames > 0 ? Math.round((taiCount / totalGames) * 100) : 50;
  const xiuPercentage = totalGames > 0 ? Math.round((xiuCount / totalGames) * 100) : 50;

  const getStreaks = () => {
    if (history.length === 0) return { currentStreak: 0, currentType: null, maxTaiStreak: 0, maxXiuStreak: 0 };
    
    let currentStreak = 1;
    let currentType = history[0]?.result;
    let maxTaiStreak = 0;
    let maxXiuStreak = 0;
    let tempStreak = 1;
    let tempType = history[0]?.result;

    for (let i = 1; i < history.length; i++) {
      if (history[i].result === tempType) {
        tempStreak++;
      } else {
        if (tempType === "tai") maxTaiStreak = Math.max(maxTaiStreak, tempStreak);
        else if (tempType === "xiu") maxXiuStreak = Math.max(maxXiuStreak, tempStreak);
        tempType = history[i].result;
        tempStreak = 1;
      }
    }
    if (tempType === "tai") maxTaiStreak = Math.max(maxTaiStreak, tempStreak);
    else if (tempType === "xiu") maxXiuStreak = Math.max(maxXiuStreak, tempStreak);

    for (let i = 1; i < history.length && history[i].result === currentType; i++) {
      currentStreak++;
    }

    return { currentStreak, currentType, maxTaiStreak, maxXiuStreak };
  };

  const streaks = getStreaks();

  const renderPatternGrid = () => {
    const rows = 5;
    const cols = 10;
    const grid: Array<Array<BetSide | null>> = Array(rows).fill(null).map(() => Array(cols).fill(null));
    
    let col = 0;
    let row = 0;
    let lastResult: BetSide | null = null;
    
    for (let i = history.length - 1; i >= 0 && col < cols; i--) {
      const result = history[i].result;
      if (result !== lastResult && lastResult !== null) {
        col++;
        row = 0;
        if (col >= cols) break;
      }
      if (row < rows) {
        grid[row][col] = result;
        row++;
      }
      lastResult = result;
    }

    return (
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array(rows).fill(null).map((_, rowIdx) => (
          Array(cols).fill(null).map((_, colIdx) => {
            const cell = grid[rowIdx][cols - 1 - colIdx];
            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={cn(
                  "w-5 h-5 rounded-full border",
                  cell === "tai" && "bg-tai border-tai",
                  cell === "xiu" && "bg-xiu border-xiu",
                  !cell && "border-border bg-muted/30"
                )}
              />
            );
          })
        ))}
      </div>
    );
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => setActiveModal(null)}
      title="Soi Cầu"
      icon={TrendingUp}
    >
      <div className="space-y-4" data-testid="soicau-modal">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-tai/10 border border-tai/30">
            <div className="text-xs text-muted-foreground mb-1">Tài</div>
            <div className="text-2xl font-bold text-tai">{taiCount}</div>
            <div className="text-sm text-muted-foreground">{taiPercentage}%</div>
          </div>
          <div className="p-3 rounded-lg bg-xiu/10 border border-xiu/30">
            <div className="text-xs text-muted-foreground mb-1">Xỉu</div>
            <div className="text-2xl font-bold text-xiu">{xiuCount}</div>
            <div className="text-sm text-muted-foreground">{xiuPercentage}%</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-tai transition-all duration-300"
              style={{ width: `${taiPercentage}%` }}
            />
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium mb-2">Chuỗi hiện tại</div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-3 py-1 rounded font-bold",
              streaks.currentType === "tai" ? "bg-tai text-white" : "bg-xiu text-white"
            )}>
              {streaks.currentType === "tai" ? "Tài" : "Xỉu"} x{streaks.currentStreak}
            </span>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Biểu đồ kết quả</div>
          {renderPatternGrid()}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-tai" />
              <span>Tài</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-xiu" />
              <span>Xỉu</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="p-2 bg-muted/30 rounded">
            <div className="text-muted-foreground">Chuỗi Tài dài nhất</div>
            <div className="font-bold text-tai">{streaks.maxTaiStreak}</div>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <div className="text-muted-foreground">Chuỗi Xỉu dài nhất</div>
            <div className="font-bold text-xiu">{streaks.maxXiuStreak}</div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

export function AllModals() {
  return (
    <>
      <DepositModal />
      <WithdrawModal />
      <GiftcodeModal />
      <LockedAccountModal />
      <HistoryModal />
      <SoiCauModal />
    </>
  );
}
