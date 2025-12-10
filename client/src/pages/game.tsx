import { useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/game/Header";
import { MenuDrawer } from "@/components/game/MenuDrawer";
import { BettingTable } from "@/components/game/BettingTable";
import { ChipSelector } from "@/components/game/ChipSelector";
import { ControlButtons } from "@/components/game/ControlButtons";
import { ResultHistory } from "@/components/game/ResultHistory";
import { BettingPlayersList } from "@/components/game/BettingPlayersList";
import { AllModals } from "@/components/game/Modals";
import { useGameStore, formatCurrency, getResultFromTotal } from "@/lib/gameStore";
import { initTelegramApp, getTelegramUser, getDisplayUsername } from "@/lib/telegram";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Game, BetWithUser } from "@shared/schema";
import casinoBackground from "@assets/IMG_3598_1765379326649.png";

export default function GamePage() {
  const {
    setUser,
    setCurrentGame,
    setBets,
    setCountdown,
    setIsRolling,
    addResultToHistory,
    selectedSide,
    betAmount,
    resetBet,
    setActiveModal,
    user,
  } = useGameStore();
  const { toast } = useToast();

  useEffect(() => {
    initTelegramApp();
  }, []);

  const { data: userData } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: 1,
  });

  const { data: currentGameData } = useQuery<Game>({
    queryKey: ["/api/games/current"],
    refetchInterval: 1000,
  });

  const { data: betsData } = useQuery<BetWithUser[]>({
    queryKey: ["/api/games/current/bets"],
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
      if (userData.isLocked) {
        setActiveModal("locked");
      }
    }
  }, [userData, setUser, setActiveModal]);

  useEffect(() => {
    if (currentGameData) {
      setCurrentGame(currentGameData);
      
      if (currentGameData.status === "rolling") {
        setIsRolling(true);
      } else if (currentGameData.status === "finished" && currentGameData.total) {
        setIsRolling(false);
        const result = getResultFromTotal(currentGameData.total);
        addResultToHistory(result, currentGameData.total);
      } else {
        setIsRolling(false);
      }
    }
  }, [currentGameData, setCurrentGame, setIsRolling, addResultToHistory]);

  useEffect(() => {
    if (betsData) {
      setBets(betsData);
    }
  }, [betsData, setBets]);

  useEffect(() => {
    if (!currentGameData || currentGameData.status !== "betting") return;

    const createdAt = new Date(currentGameData.createdAt).getTime();
    const bettingDuration = 30 * 1000;
    
    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = now - createdAt;
      const remaining = Math.max(0, Math.ceil((bettingDuration - elapsed) / 1000));
      setCountdown(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentGameData, setCountdown]);

  const placeBetMutation = useMutation({
    mutationFn: async (data: { side: "tai" | "xiu"; amount: number }) => {
      return apiRequest("POST", "/api/bets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/current/bets"] });
      toast({
        title: "Đặt cược thành công!",
        description: `Đã đặt ${formatCurrency(betAmount)} vào ${selectedSide === "tai" ? "Tài" : "Xỉu"}`,
      });
      resetBet();
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể đặt cược",
        variant: "destructive",
      });
    },
  });

  const handleConfirmBet = useCallback(() => {
    if (!selectedSide || betAmount <= 0) return;
    
    const balance = parseFloat(user?.balance?.toString() || "0");
    if (betAmount > balance) {
      toast({
        title: "Số dư không đủ",
        description: "Vui lòng nạp thêm tiền để tiếp tục chơi",
        variant: "destructive",
      });
      return;
    }

    placeBetMutation.mutate({ side: selectedSide, amount: betAmount });
  }, [selectedSide, betAmount, user, placeBetMutation, toast]);

  const handleCancelBet = useCallback(() => {
    resetBet();
  }, [resetBet]);

  return (
    <div
      className="min-h-screen flex flex-col bg-background relative"
      style={{
        backgroundImage: `url(${casinoBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      data-testid="game-page"
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 flex flex-col p-3 gap-3 max-w-lg mx-auto w-full">
          <BettingTable />
          <ChipSelector />
          <ControlButtons
            onConfirm={handleConfirmBet}
            onCancel={handleCancelBet}
            isLoading={placeBetMutation.isPending}
          />
          <ResultHistory />
          <BettingPlayersList />
        </main>
      </div>

      <MenuDrawer />
      <AllModals />
    </div>
  );
}
