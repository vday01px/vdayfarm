import { Button } from "@/components/ui/button";
import { useGameStore, formatCurrency } from "@/lib/gameStore";
import { X, Hash, Hand, Check } from "lucide-react";

interface ControlButtonsProps {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ControlButtons({ onConfirm, onCancel, isLoading }: ControlButtonsProps) {
  const { betAmount, selectedSide, user, resetBet } = useGameStore();
  const balance = parseFloat(user?.balance?.toString() || "0");

  const handleAllIn = () => {
    if (balance > 0) {
      useGameStore.getState().setBetAmount(balance);
    }
  };

  const handleCancel = () => {
    resetBet();
    onCancel();
  };

  const canConfirm = selectedSide && betAmount > 0 && betAmount <= balance;

  return (
    <div className="flex flex-wrap gap-2 p-3" data-testid="control-buttons">
      <Button
        variant="secondary"
        onClick={handleCancel}
        disabled={isLoading}
        className="flex-1 min-w-[70px]"
        data-testid="button-cancel"
      >
        <X className="w-4 h-4 mr-1" />
        HỦY
      </Button>
      
      <Button
        variant="secondary"
        onClick={() => {}}
        disabled={isLoading}
        className="flex-1 min-w-[70px]"
        data-testid="button-custom-amount"
      >
        <Hash className="w-4 h-4 mr-1" />
        SỐ KHÁC
      </Button>
      
      <Button
        variant="destructive"
        onClick={handleAllIn}
        disabled={isLoading || balance <= 0}
        className="flex-1 min-w-[70px] bg-orange-600 hover:bg-orange-700"
        data-testid="button-all-in"
      >
        <Hand className="w-4 h-4 mr-1" />
        TẤT TAY
      </Button>
      
      <Button
        variant="default"
        onClick={onConfirm}
        disabled={!canConfirm || isLoading}
        className="flex-[2] min-w-[120px] bg-casino-green hover:bg-casino-green/90"
        data-testid="button-confirm"
      >
        <Check className="w-4 h-4 mr-1" />
        ĐỒNG Ý
        {betAmount > 0 && (
          <span className="ml-1 text-xs">({formatCurrency(betAmount)})</span>
        )}
      </Button>
    </div>
  );
}
