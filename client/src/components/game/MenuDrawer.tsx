import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, ArrowDownToLine, Gift, Headphones, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore, formatCurrency } from "@/lib/gameStore";
import { isAdmin, openTelegramChat } from "@/lib/telegram";
import { useLocation } from "wouter";

export function MenuDrawer() {
  const { isMenuOpen, setMenuOpen, user, setActiveModal } = useGameStore();
  const [, setLocation] = useLocation();
  const balance = parseFloat(user?.balance?.toString() || "0");
  const username = user?.username || "Guest";
  const userIsAdmin = isAdmin(username);

  const menuItems = [
    {
      icon: Wallet,
      label: "Nạp tiền",
      onClick: () => {
        setActiveModal("deposit");
        setMenuOpen(false);
      },
    },
    {
      icon: ArrowDownToLine,
      label: "Rút tiền",
      onClick: () => {
        setActiveModal("withdraw");
        setMenuOpen(false);
      },
    },
    {
      icon: Gift,
      label: "Giftcode",
      onClick: () => {
        setActiveModal("giftcode");
        setMenuOpen(false);
      },
    },
    {
      icon: Headphones,
      label: "CSKH",
      onClick: () => {
        openTelegramChat("vdaychim99");
        setMenuOpen(false);
      },
    },
  ];

  if (userIsAdmin) {
    menuItems.push({
      icon: Crown,
      label: "Admin Panel",
      onClick: () => {
        setLocation("/admin");
        setMenuOpen(false);
      },
    });
  }

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setMenuOpen(false)}
            data-testid="menu-overlay"
          />
          
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-sidebar-border z-50 flex flex-col"
            data-testid="menu-drawer"
          >
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <h2 className="text-lg font-bold text-casino-gold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-close-menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 border-b border-sidebar-border">
              <div className="text-sm text-muted-foreground mb-1">Xin chào,</div>
              <div className="text-lg font-semibold text-foreground">{username}</div>
              <div className="flex items-center gap-2 mt-2 text-casino-gold">
                <Wallet className="w-4 h-4" />
                <span className="font-mono font-bold">{formatCurrency(balance)}</span>
              </div>
            </div>

            <nav className="flex-1 p-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 p-4 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                  data-testid={`menu-item-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <item.icon className={item.icon === Crown ? "w-5 h-5 text-casino-gold" : "w-5 h-5"} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border">
              <p className="text-xs text-muted-foreground text-center">
                Game Tài Xỉu v1.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
