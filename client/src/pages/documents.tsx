import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { FileText, Plus, Search, Download, Eye } from "lucide-react";
import { useState } from "react";
import type { Document } from "@shared/schema";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const filtered = documents.filter(doc =>
    doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.companyName.includes(searchTerm) ||
    doc.driverName.includes(searchTerm)
  );

  const handleDownloadPdf = (docId: string, docNumber: string) => {
    window.open(`/api/documents/${docId}/pdf`, '_blank');
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">الوثائق</h1>
          <p className="text-muted-foreground text-sm">جميع وثائق الشحن المسجلة في النظام</p>
        </div>
        <Link href="/documents/new">
          <Button data-testid="button-new-document">
            <Plus className="h-4 w-4 ml-1" />
            وثيقة جديدة
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-search-documents"
          className="pr-10"
          placeholder="البحث في الوثائق..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              {searchTerm ? "لا توجد نتائج مطابقة" : "لا توجد وثائق حتى الآن"}
            </p>
            {!searchTerm && (
              <Link href="/documents/new">
                <Button variant="secondary">إنشاء وثيقة</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => (
            <Card key={doc.id} className="hover-elevate" data-testid={`card-document-${doc.id}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{doc.documentNumber}</p>
                      <p className="text-xs text-muted-foreground">{doc.companyName}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">السائق: {doc.driverName}</span>
                        <span className="text-xs text-muted-foreground">|</span>
                        <span className="text-xs text-muted-foreground">المنفذ: {doc.checkpointName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={doc.status === "active" ? "default" : "secondary"}>
                      {doc.status === "active" ? "فعال" : "غير فعال"}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(doc.createdAt).toLocaleDateString('ar-IQ')}
                    </span>
                    <Link href={`/documents/${doc.id}`}>
                      <Button variant="ghost" size="icon" data-testid={`button-view-${doc.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDownloadPdf(doc.id, doc.documentNumber)} data-testid={`button-download-${doc.id}`}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
