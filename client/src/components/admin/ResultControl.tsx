import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, useGameStore } from "@/lib/gameStore";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dices, Settings2, TrendingUp, TrendingDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameSettings, BetWithUser } from "@shared/schema";

export function ResultControl() {
  const { currentGame, bets } = useGameStore();
  const [manualResult, setManualResult] = useState<"tai" | "xiu" | null>(null);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoLosePercent, setAutoLosePercent] = useState(60);
  const { toast } = useToast();

  const { data: settings } = useQuery<GameSettings>({
    queryKey: ["/api/admin/settings"],
  });

  const setManualResultMutation = useMutation({
    mutationFn: async (result: "tai" | "xiu" | null) => {
      return apiRequest("POST", "/api/admin/game/manual-result", { result });
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: manualResult ? `Đã chọn kết quả: ${manualResult === "tai" ? "Tài" : "Xỉu"}` : "Đã hủy chọn kết quả",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể đặt kết quả",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { autoControlEnabled: boolean; autoLosePercent: number }) => {
      return apiRequest("PATCH", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật cài đặt",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật cài đặt",
        variant: "destructive",
      });
    },
  });

  const handleManualSelect = (result: "tai" | "xiu") => {
    const newResult = manualResult === result ? null : result;
    setManualResult(newResult);
    setManualResultMutation.mutate(newResult);
  };

  const handleAutoSettingsChange = () => {
    updateSettingsMutation.mutate({
      autoControlEnabled: autoEnabled,
      autoLosePercent,
    });
  };

  const taiBets = bets.filter((bet) => bet.side === "tai");
  const xiuBets = bets.filter((bet) => bet.side === "xiu");
  const taiTotal = taiBets.reduce((sum, bet) => sum + parseFloat(bet.amount.toString()), 0);
  const xiuTotal = xiuBets.reduce((sum, bet) => sum + parseFloat(bet.amount.toString()), 0);

  const PlayerList = ({ players, side }: { players: BetWithUser[]; side: "tai" | "xiu" }) => (
    <ScrollArea className="h-32 rounded-lg border border-border bg-muted/30">
      {players.length === 0 ? (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          Chưa có người đặt
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {players.map((bet, index) => (
            <div
              key={bet.id || index}
              className="flex items-center justify-between text-xs p-1.5 rounded bg-card"
            >
              <span className="truncate max-w-[100px]">{bet.user?.username || "Ẩn danh"}</span>
              <span className="font-mono text-casino-gold">{formatCurrency(bet.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="result-control">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-casino-gold" />
            Chỉnh kết quả thủ công
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              variant={manualResult === "tai" ? "default" : "secondary"}
              className={cn(
                "flex-1 h-16",
                manualResult === "tai" && "bg-tai hover:bg-tai/90"
              )}
              onClick={() => handleManualSelect("tai")}
              disabled={setManualResultMutation.isPending}
              data-testid="button-manual-tai"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Tài (11-18)
            </Button>
            <Button
              variant={manualResult === "xiu" ? "default" : "secondary"}
              className={cn(
                "flex-1 h-16",
                manualResult === "xiu" && "bg-xiu hover:bg-xiu/90"
              )}
              onClick={() => handleManualSelect("xiu")}
              disabled={setManualResultMutation.isPending}
              data-testid="button-manual-xiu"
            >
              <TrendingDown className="w-5 h-5 mr-2" />
              Xỉu (3-10)
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Người chơi đang đặt</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="destructive" className="bg-tai">Tài</Badge>
                  <span className="text-xs text-muted-foreground">
                    {taiBets.length} người - {formatCurrency(taiTotal)}
                  </span>
                </div>
                <PlayerList players={taiBets} side="tai" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-xiu">Xỉu</Badge>
                  <span className="text-xs text-muted-foreground">
                    {xiuBets.length} người - {formatCurrency(xiuTotal)}
                  </span>
                </div>
                <PlayerList players={xiuBets} side="xiu" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-casino-gold" />
            Chỉnh kết quả tự động
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-toggle">Bật chế độ tự động</Label>
              <p className="text-xs text-muted-foreground">
                Tự động chọn cổng có tiền cược nhiều hơn thua
              </p>
            </div>
            <Switch
              id="auto-toggle"
              checked={autoEnabled}
              onCheckedChange={setAutoEnabled}
              data-testid="switch-auto-control"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tỉ lệ thua cổng tiền nhiều</Label>
              <span className="text-sm font-mono text-casino-gold">{autoLosePercent}%</span>
            </div>
            <Slider
              value={[autoLosePercent]}
              onValueChange={([v]) => setAutoLosePercent(v)}
              min={0}
              max={100}
              step={5}
              disabled={!autoEnabled}
              className="w-full"
              data-testid="slider-lose-percent"
            />
            <p className="text-xs text-muted-foreground">
              {autoLosePercent}% cơ hội cổng có tiền nhiều hơn sẽ thua
            </p>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">Tổng tiền cược hiện tại</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Badge variant="destructive" className="bg-tai">Tài</Badge>
                <span className="font-mono text-sm">{formatCurrency(taiTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge className="bg-xiu">Xỉu</Badge>
                <span className="font-mono text-sm">{formatCurrency(xiuTotal)}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleAutoSettingsChange}
            disabled={updateSettingsMutation.isPending}
            className="w-full"
            data-testid="button-save-auto-settings"
          >
            {updateSettingsMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
