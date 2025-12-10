import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, ArrowDownToLine, Gift, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameStore, formatCurrency } from "@/lib/gameStore";
import { openTelegramChat } from "@/lib/telegram";
import { useToast } from "@/hooks/use-toast";

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

export function AllModals() {
  return (
    <>
      <DepositModal />
      <WithdrawModal />
      <GiftcodeModal />
      <LockedAccountModal />
    </>
  );
}
