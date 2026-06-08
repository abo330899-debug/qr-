import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowRight, TrendingUp, TrendingDown, Wallet, FileText, Plus, CheckCircle2, AlertCircle, Calendar, User } from "lucide-react";
import type { Company, Transaction } from "@shared/schema";

interface CompanyStatementData {
  company: Company;
  transactions: Transaction[];
  balance: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CompanyStatement() {
  const { companyId } = useParams<{ companyId: string }>();
  const { toast } = useToast();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDesc, setPaymentDesc] = useState("");

  const { data, isLoading } = useQuery<CompanyStatementData>({
    queryKey: ["/api/accounting", companyId, "transactions"],
    queryFn: async () => {
      const res = await fetch(`/api/accounting/${companyId}/transactions`);
      if (!res.ok) throw new Error("فشل في تحميل البيانات");
      return res.json();
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/accounting/${companyId}/payment`, {
        amount: paymentAmount,
        description: paymentDesc || "دفعة مستلمة",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting", companyId, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/summary"] });
      toast({ title: "تم تسجيل الدفعة بنجاح" });
      setPaymentOpen(false);
      setPaymentAmount("");
      setPaymentDesc("");
    },
    onError: (e: Error) => {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground" dir="rtl">
        الشركة غير موجودة
      </div>
    );
  }

  const { company, transactions, balance } = data;
  const totalCharged = transactions.filter(t => t.type === "charge").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalPaid = transactions.filter(t => t.type === "payment").reduce((s, t) => s + parseFloat(t.amount), 0);

  let running = 0;
  const rows = [...transactions].reverse().map(tx => {
    const amt = parseFloat(tx.amount);
    if (tx.type === "charge") running += amt;
    else running -= amt;
    return { ...tx, runningBalance: running };
  }).reverse();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
      {/* الرأس */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/accounting">
            <Button variant="ghost" size="sm" data-testid="button-back-accounting">
              <ArrowRight className="h-4 w-4 ml-1" />
              الحسابات
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold" data-testid="text-company-name">{company.companyName}</h1>
            <p className="text-xs text-muted-foreground">{company.governorate} · {company.specialization}</p>
          </div>
        </div>
        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" data-testid="button-add-payment">
              <Plus className="h-4 w-4" />
              تسجيل دفعة
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-sm">
            <DialogHeader>
              <DialogTitle>تسجيل دفعة مستلمة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>المبلغ بالدولار ($) *</Label>
                <Input
                  data-testid="input-payment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>البيان / الملاحظة</Label>
                <Input
                  data-testid="input-payment-desc"
                  placeholder="مثال: دفعة جزئية مستلمة"
                  value={paymentDesc}
                  onChange={e => setPaymentDesc(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || paymentMutation.isPending}
                onClick={() => paymentMutation.mutate()}
                data-testid="button-confirm-payment"
              >
                {paymentMutation.isPending ? "جاري الحفظ..." : "تأكيد الدفعة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/40">
              <TrendingUp className="h-4 w-4 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-green-700">إجمالي المستحقات</p>
              <p className="text-lg font-bold text-green-800" data-testid="text-total-charged">${fmt(totalCharged)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/40">
              <TrendingDown className="h-4 w-4 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-blue-700">إجمالي المدفوعات</p>
              <p className="text-lg font-bold text-blue-800" data-testid="text-total-paid">${fmt(totalPaid)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-2 ${balance > 0 ? "border-orange-200 bg-orange-50 dark:bg-orange-950/20" : "border-green-200 bg-green-50 dark:bg-green-950/20"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-full ${balance > 0 ? "bg-orange-100 dark:bg-orange-900/40" : "bg-green-100 dark:bg-green-900/40"}`}>
              <Wallet className={`h-4 w-4 ${balance > 0 ? "text-orange-700" : "text-green-700"}`} />
            </div>
            <div>
              <p className={`text-xs ${balance > 0 ? "text-orange-700" : "text-green-700"}`}>
                {balance > 0 ? "رصيد مستحق" : "مسوّى"}
              </p>
              <p className={`text-lg font-bold ${balance > 0 ? "text-orange-800" : "text-green-800"}`} data-testid="text-balance">
                ${fmt(balance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* كشف الحساب */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            كشف الحساب التفصيلي
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              لا توجد معاملات بعد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-right p-3 font-semibold text-muted-foreground">#</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">التاريخ</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">البيان</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">رقم الوثيقة</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">اسم السائق</th>
                    <th className="text-right p-3 font-semibold text-muted-foreground">النوع</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">مدين ($)</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">دائن ($)</th>
                    <th className="text-left p-3 font-semibold text-muted-foreground">الرصيد ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((tx, idx) => (
                    <tr
                      key={tx.id}
                      className="border-b hover:bg-muted/20 transition-colors"
                      data-testid={`row-transaction-${tx.id}`}
                    >
                      <td className="p-3 text-muted-foreground text-xs">{rows.length - idx}</td>
                      <td className="p-3 text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {fmtDate(tx.createdAt)}
                        </span>
                      </td>
                      <td className="p-3 text-xs max-w-[180px]">
                        <span className="line-clamp-2">{tx.description || "—"}</span>
                      </td>
                      <td className="p-3 text-xs">
                        {tx.documentNumber ? (
                          <Link href={`/documents/${tx.documentId}`}>
                            <span className="text-primary underline underline-offset-2 cursor-pointer hover:text-primary/80">
                              {tx.documentNumber}
                            </span>
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="p-3 text-xs">
                        {tx.driverName ? (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {tx.driverName}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-3">
                        {tx.type === "charge" ? (
                          <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
                            <AlertCircle className="h-3 w-3 ml-1" />
                            مديونية
                          </Badge>
                        ) : (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                            دفعة
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-left font-medium">
                        {tx.type === "charge" ? (
                          <span className="text-orange-600">{fmt(parseFloat(tx.amount))}</span>
                        ) : "—"}
                      </td>
                      <td className="p-3 text-left font-medium">
                        {tx.type === "payment" ? (
                          <span className="text-green-600">{fmt(parseFloat(tx.amount))}</span>
                        ) : "—"}
                      </td>
                      <td className="p-3 text-left font-bold">
                        <span className={tx.runningBalance > 0 ? "text-orange-600" : "text-green-600"}>
                          {fmt(tx.runningBalance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/40 font-bold">
                    <td colSpan={6} className="p-3 text-right text-sm">الإجمالي</td>
                    <td className="p-3 text-left text-orange-700">{fmt(totalCharged)}</td>
                    <td className="p-3 text-left text-green-700">{fmt(totalPaid)}</td>
                    <td className={`p-3 text-left ${balance > 0 ? "text-orange-700" : "text-green-700"}`}>{fmt(balance)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
