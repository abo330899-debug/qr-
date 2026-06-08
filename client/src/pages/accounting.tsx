import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Building2, TrendingUp, TrendingDown, Wallet, FileText, ChevronLeft, DollarSign } from "lucide-react";
import type { Company } from "@shared/schema";

interface AccountingSummaryItem {
  company: Company;
  balance: number;
  totalCharged: number;
  totalPaid: number;
  transactionCount: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Accounting() {
  const { data: summary = [], isLoading } = useQuery<AccountingSummaryItem[]>({
    queryKey: ["/api/accounting/summary"],
  });

  const totalCharged = summary.reduce((s, i) => s + i.totalCharged, 0);
  const totalPaid = summary.reduce((s, i) => s + i.totalPaid, 0);
  const totalBalance = totalCharged - totalPaid;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">نظام الحسابات</h1>
        <p className="text-muted-foreground text-sm">كشف حساب عام لجميع الشركات</p>
      </div>

      {/* الإجماليات العامة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/40">
              <TrendingUp className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-green-700 font-medium">إجمالي المستحقات</p>
              <p className="text-xl font-bold text-green-800" data-testid="text-total-charged">
                ${fmt(totalCharged)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/40">
              <TrendingDown className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">إجمالي المدفوعات</p>
              <p className="text-xl font-bold text-blue-800" data-testid="text-total-paid">
                ${fmt(totalPaid)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-2 ${totalBalance > 0 ? "border-orange-200 bg-orange-50 dark:bg-orange-950/20" : "border-green-200 bg-green-50 dark:bg-green-950/20"}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-full ${totalBalance > 0 ? "bg-orange-100 dark:bg-orange-900/40" : "bg-green-100 dark:bg-green-900/40"}`}>
              <Wallet className={`h-5 w-5 ${totalBalance > 0 ? "text-orange-700" : "text-green-700"}`} />
            </div>
            <div>
              <p className={`text-xs font-medium ${totalBalance > 0 ? "text-orange-700" : "text-green-700"}`}>الرصيد الكلي المتبقي</p>
              <p className={`text-xl font-bold ${totalBalance > 0 ? "text-orange-800" : "text-green-800"}`} data-testid="text-total-balance">
                ${fmt(totalBalance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة الشركات */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            حسابات الشركات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : summary.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              لا توجد شركات مسجلة بعد
            </div>
          ) : (
            <div className="divide-y">
              {summary.map((item) => (
                <div
                  key={item.company.id}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors"
                  data-testid={`row-company-${item.company.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-full bg-primary/10 shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{item.company.companyName}</p>
                      <p className="text-xs text-muted-foreground">{item.company.governorate} · {item.company.specialization}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-xs text-muted-foreground">المستحقات</p>
                      <p className="text-sm font-semibold text-green-700">${fmt(item.totalCharged)}</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-xs text-muted-foreground">المدفوعات</p>
                      <p className="text-sm font-semibold text-blue-700">${fmt(item.totalPaid)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">الرصيد</p>
                      <p className={`text-sm font-bold ${item.balance > 0 ? "text-orange-600" : "text-green-600"}`}>
                        ${fmt(item.balance)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs gap-1">
                        <FileText className="h-3 w-3" />
                        {item.transactionCount} معاملة
                      </Badge>
                      <Link href={`/accounting/${item.company.id}`}>
                        <Button size="sm" variant="outline" data-testid={`button-view-statement-${item.company.id}`}>
                          كشف الحساب
                          <ChevronLeft className="h-3 w-3 mr-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
