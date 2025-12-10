import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/gameStore";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Lock, Unlock, Eye, Users } from "lucide-react";
import type { User } from "@shared/schema";

type TimeFilter = "today" | "7days" | "30days" | "all";

export function UserManagement() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", timeFilter],
  });

  const toggleLockMutation = useMutation({
    mutationFn: async ({ userId, isLocked }: { userId: string; isLocked: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/lock`, { isLocked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái tài khoản",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.telegramId.includes(searchQuery)
  );

  const timeFilterButtons: { value: TimeFilter; label: string }[] = [
    { value: "today", label: "Hôm nay" },
    { value: "7days", label: "7 ngày" },
    { value: "30days", label: "30 ngày" },
    { value: "all", label: "Tất cả" },
  ];

  return (
    <div className="space-y-4" data-testid="user-management">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-casino-gold" />
            Quản lý người dùng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {timeFilterButtons.map((btn) => (
              <Button
                key={btn.value}
                variant={timeFilter === btn.value ? "default" : "secondary"}
                size="sm"
                onClick={() => setTimeFilter(btn.value)}
                data-testid={`filter-${btn.value}`}
              >
                {btn.label}
              </Button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo username hoặc Telegram ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-users"
            />
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-8 h-8 border-2 border-casino-gold border-t-transparent rounded-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead className="text-right">Số dư</TableHead>
                    <TableHead className="text-right">Tổng nạp</TableHead>
                    <TableHead className="text-right">Tổng cược</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="text-right font-mono text-casino-gold">
                        {formatCurrency(user.balance)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(user.totalDeposit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(user.totalBet)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isLocked ? "destructive" : "secondary"}>
                          {user.isLocked ? "Đã khóa" : "Hoạt động"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedUser(user)}
                            data-testid={`button-view-${user.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toggleLockMutation.mutate({
                                userId: user.id,
                                isLocked: !user.isLocked,
                              })
                            }
                            data-testid={`button-lock-${user.id}`}
                          >
                            {user.isLocked ? (
                              <Unlock className="w-4 h-4 text-green-500" />
                            ) : (
                              <Lock className="w-4 h-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng: {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Số dư</div>
                  <div className="text-lg font-bold text-casino-gold font-mono">
                    {formatCurrency(selectedUser.balance)}
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Tổng nạp</div>
                  <div className="text-lg font-bold font-mono">
                    {formatCurrency(selectedUser.totalDeposit)}
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Tổng rút</div>
                  <div className="text-lg font-bold font-mono">
                    {formatCurrency(selectedUser.totalWithdraw)}
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground">Tổng cược</div>
                  <div className="text-lg font-bold font-mono">
                    {formatCurrency(selectedUser.totalBet)}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Telegram ID</div>
                <div className="font-mono">{selectedUser.telegramId}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Ngày tạo</div>
                <div className="font-mono">
                  {new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
              <Button
                variant={selectedUser.isLocked ? "default" : "destructive"}
                className="w-full"
                onClick={() => {
                  toggleLockMutation.mutate({
                    userId: selectedUser.id,
                    isLocked: !selectedUser.isLocked,
                  });
                  setSelectedUser(null);
                }}
              >
                {selectedUser.isLocked ? (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Mở khóa tài khoản
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Khóa tài khoản
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
