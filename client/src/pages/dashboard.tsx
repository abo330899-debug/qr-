import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Building2, FileText, QrCode, ArrowLeft, Plus, Search } from "lucide-react";
import type { Company, Document } from "@shared/schema";

export default function Dashboard() {
  const { data: companies = [], isLoading: loadingCompanies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: documents = [], isLoading: loadingDocs } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const activeDocuments = documents.filter(d => d.status === "active");

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">لوحة التحكم</h1>
        <p className="text-muted-foreground text-sm">مرحباً بك في نظام إدارة وثائق الكمارك</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الشركات المسجلة</CardTitle>
            <Building2 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-companies-count">
              {loadingCompanies ? "..." : companies.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الوثائق</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-documents-count">
              {loadingDocs ? "..." : documents.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">الوثائق الفعالة</CardTitle>
            <QrCode className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-active-count">
              {loadingDocs ? "..." : activeDocuments.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/documents/new">
          <Card className="cursor-pointer hover-elevate transition-all border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-7 w-7 text-primary" />
              </div>
              <span className="font-semibold text-sm">إنشاء وثيقة جديدة</span>
              <span className="text-xs text-muted-foreground">إنشاء وثيقة شحن مع رمز QR</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/verify">
          <Card className="cursor-pointer hover-elevate transition-all border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="h-7 w-7 text-primary" />
              </div>
              <span className="font-semibold text-sm">التحقق من وثيقة</span>
              <span className="text-xs text-muted-foreground">التحقق من صحة وثيقة عبر رقمها</span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/companies">
          <Card className="cursor-pointer hover-elevate transition-all border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <span className="font-semibold text-sm">إدارة الشركات</span>
              <span className="text-xs text-muted-foreground">إضافة وتعديل بيانات الشركات</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-1">
          <CardTitle className="text-base">آخر الوثائق</CardTitle>
          <Link href="/documents">
            <Button variant="ghost" size="sm" data-testid="button-view-all-docs">
              عرض الكل
              <ArrowLeft className="h-4 w-4 mr-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingDocs ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              لا توجد وثائق حتى الآن
            </div>
          ) : (
            <div className="space-y-2">
              {documents.slice(0, 5).map((doc) => (
                <Link key={doc.id} href={`/documents/${doc.id}`}>
                  <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/40 hover-elevate cursor-pointer" data-testid={`row-document-${doc.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.documentNumber}</p>
                        <p className="text-xs text-muted-foreground">{doc.companyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status === "active" ? "default" : "secondary"}>
                        {doc.status === "active" ? "فعال" : "غير فعال"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString('ar-IQ')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
