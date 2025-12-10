import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserManagement } from "@/components/admin/UserManagement";
import { GiftcodeManagement } from "@/components/admin/GiftcodeManagement";
import { ResultControl } from "@/components/admin/ResultControl";
import { isAdmin } from "@/lib/telegram";
import { ArrowLeft, Users, Gift, Dices, Crown } from "lucide-react";
import type { User } from "@shared/schema";

export default function AdminPage() {
  const [, setLocation] = useLocation();

  const { data: userData, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  useEffect(() => {
    if (!isLoading && userData && !isAdmin(userData.username)) {
      setLocation("/");
    }
  }, [userData, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-casino-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!userData || !isAdmin(userData.username)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-page">
      <header className="sticky top-0 z-50 flex items-center gap-3 p-4 bg-card border-b border-casino-gold/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-foreground"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-casino-gold" />
          <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2" data-testid="tab-users">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Người dùng</span>
            </TabsTrigger>
            <TabsTrigger value="giftcodes" className="flex items-center gap-2" data-testid="tab-giftcodes">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Giftcode</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2" data-testid="tab-results">
              <Dices className="w-4 h-4" />
              <span className="hidden sm:inline">Kết quả</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="giftcodes">
            <GiftcodeManagement />
          </TabsContent>

          <TabsContent value="results">
            <ResultControl />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
