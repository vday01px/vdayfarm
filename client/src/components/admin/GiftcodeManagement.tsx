import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/gameStore";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Gift, Plus, Trash2, Copy } from "lucide-react";
import type { Giftcode } from "@shared/schema";

type GiftcodeCondition = "deposit" | "bet" | "both";

export function GiftcodeManagement() {
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [maxUses, setMaxUses] = useState("1");
  const [condition, setCondition] = useState<GiftcodeCondition>("deposit");
  const [conditionAmount, setConditionAmount] = useState("1000000");
  const [multiplier, setMultiplier] = useState("2");
  const { toast } = useToast();

  const { data: giftcodes = [], isLoading } = useQuery<Giftcode[]>({
    queryKey: ["/api/admin/giftcodes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      code?: string;
      amount: number;
      quantity: number;
      maxUses: number;
      condition: GiftcodeCondition;
      conditionAmount: number;
      withdrawMultiplier: number;
    }) => {
      return apiRequest("POST", "/api/admin/giftcodes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/giftcodes"] });
      toast({
        title: "Thành công",
        description: "Đã tạo giftcode mới",
      });
      setCode("");
      setAmount("");
      setQuantity("1");
      setMaxUses("1");
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo giftcode",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/giftcodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/giftcodes"] });
      toast({
        title: "Thành công",
        description: "Đã xóa giftcode",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa giftcode",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền hợp lệ",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      code: code.trim() || undefined,
      amount: parseFloat(amount),
      quantity: parseInt(quantity) || 1,
      maxUses: parseInt(maxUses) || 1,
      condition,
      conditionAmount: parseFloat(conditionAmount) || 0,
      withdrawMultiplier: parseInt(multiplier) || 2,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: text,
    });
  };

  const conditionLabels: Record<GiftcodeCondition, string> = {
    deposit: "Tổng nạp",
    bet: "Tổng cược",
    both: "Cả hai",
  };

  return (
    <div className="space-y-4" data-testid="giftcode-management">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-casino-gold" />
            Tạo Giftcode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Mã code (để trống để tự tạo)</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: NEWYEAR2024"
                data-testid="input-giftcode-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 50000"
                data-testid="input-giftcode-amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Số lượng code tạo</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                disabled={!!code.trim()}
                data-testid="input-giftcode-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses">Số lượt nhập / code</Label>
              <Input
                id="maxUses"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
                data-testid="input-giftcode-maxuses"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Điều kiện nhận</Label>
            <RadioGroup
              value={condition}
              onValueChange={(v) => setCondition(v as GiftcodeCondition)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deposit" id="deposit" />
                <Label htmlFor="deposit">Tổng nạp</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bet" id="bet" />
                <Label htmlFor="bet">Tổng cược</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both">Cả hai</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="conditionAmount">Điều kiện (số tiền trong tháng)</Label>
              <Input
                id="conditionAmount"
                type="number"
                value={conditionAmount}
                onChange={(e) => setConditionAmount(e.target.value)}
                placeholder="VD: 1000000"
                data-testid="input-giftcode-condition"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="multiplier">Điều kiện rút (vòng cược)</Label>
              <Select value={multiplier} onValueChange={setMultiplier}>
                <SelectTrigger id="multiplier" data-testid="select-multiplier">
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">x2</SelectItem>
                  <SelectItem value="3">x3</SelectItem>
                  <SelectItem value="4">x4</SelectItem>
                  <SelectItem value="5">x5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="w-full bg-casino-gold hover:bg-casino-gold-light text-accent-foreground"
            data-testid="button-create-giftcode"
          >
            <Plus className="w-4 h-4 mr-2" />
            {createMutation.isPending ? "Đang tạo..." : "Tạo Giftcode"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Danh sách Giftcode</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-8 h-8 border-2 border-casino-gold border-t-transparent rounded-full" />
              </div>
            ) : giftcodes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Chưa có giftcode nào
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead className="text-center">Đã dùng</TableHead>
                    <TableHead>Điều kiện</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giftcodes.map((gc) => (
                    <TableRow key={gc.id} data-testid={`giftcode-row-${gc.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-casino-gold">{gc.code}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(gc.code)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(gc.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {gc.currentUses}/{gc.maxUses}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {conditionLabels[gc.condition]} x{gc.withdrawMultiplier}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(gc.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(gc.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${gc.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
