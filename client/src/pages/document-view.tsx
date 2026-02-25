import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useParams } from "wouter";
import { ArrowRight, Download, Printer, FileText, QrCode, Truck, Building2, MapPin } from "lucide-react";
import { Link } from "wouter";
import type { Document, DocumentItem } from "@shared/schema";

interface DocumentWithItems extends Document {
  items: DocumentItem[];
}

export default function DocumentView() {
  const params = useParams<{ id: string }>();

  const { data: doc, isLoading, error } = useQuery<DocumentWithItems>({
    queryKey: ["/api/documents", params.id],
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.open(`/api/documents/${params.id}/pdf`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded w-48" />
        <div className="h-64 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="h-12 w-12 text-destructive/40" />
            <p className="text-muted-foreground">الوثيقة غير موجودة</p>
            <Link href="/documents">
              <Button variant="secondary">العودة للوثائق</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/documents">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold" data-testid="text-document-number">{doc.documentNumber}</h1>
            <p className="text-sm text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={doc.status === "active" ? "default" : "secondary"}>
            {doc.status === "active" ? "فعال" : "غير فعال"}
          </Badge>
          <Button variant="secondary" size="sm" onClick={handlePrint} data-testid="button-print">
            <Printer className="h-4 w-4 ml-1" />
            طباعة
          </Button>
          <Button size="sm" onClick={handleDownloadPdf} data-testid="button-download-pdf">
            <Download className="h-4 w-4 ml-1" />
            تحميل PDF
          </Button>
        </div>
      </div>

      <div className="print:block" id="printable-document">
        <Card className="print:shadow-none print:border-none">
          <div className="bg-primary text-primary-foreground p-6 rounded-t-md print:bg-[#1a5632]">
            <div className="flex items-center justify-between gap-4">
              <div className="text-right">
                <p className="text-sm opacity-80">جمهورية العراق</p>
                <p className="text-sm opacity-80">وزارة المالية</p>
                <p className="text-sm opacity-80">الهيئة العامة للكمارك</p>
              </div>
              <div className="text-center">
                <img src="/images/customes-logo.png" alt="Logo" className="w-16 h-16 mx-auto" />
              </div>
              <div className="text-left" dir="ltr">
                <p className="text-sm opacity-80">Republic of Iraq</p>
                <p className="text-sm opacity-80">Ministry of Finance</p>
                <p className="text-sm opacity-80">General Commission of Customs</p>
              </div>
            </div>
            <h2 className="text-center text-lg font-bold mt-4">وثيقة شحن</h2>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-md bg-muted/40">
                <p className="text-xs text-muted-foreground mb-1">رقم الوثيقة</p>
                <p className="text-sm font-semibold" data-testid="text-doc-number">{doc.documentNumber}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/40">
                <p className="text-xs text-muted-foreground mb-1">تاريخ الإنشاء</p>
                <p className="text-sm font-semibold">{new Date(doc.createdAt).toLocaleDateString('ar-IQ')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                معلومات الشركة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoField label="اسم الشركة / المشروع" value={doc.companyName} />
                <InfoField label="التخصص" value={doc.specialization || "-"} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                معلومات الشحن
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoField label="اسم السائق" value={doc.driverName} />
                <InfoField label="رقم المركبة" value={doc.vehicleNumber} />
                <InfoField label="رقم الإجازة" value={doc.licenceNumber} />
                <InfoField label="الوزن / الكمية" value={doc.weightQuantity} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                المنفذ والموقع
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoField label="المنفذ الكمركي" value={doc.checkpointName} />
                <InfoField label="المحافظة" value={doc.governorate} />
              </div>
            </div>

            {doc.items && doc.items.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">المواد / البضائع</h3>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right w-12">#</TableHead>
                        <TableHead className="text-right">المادة</TableHead>
                        <TableHead className="text-right">خط الإنتاج</TableHead>
                        <TableHead className="text-right">الوحدة</TableHead>
                        <TableHead className="text-right">الطاقة</TableHead>
                        <TableHead className="text-right">الكمية المطلوبة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doc.items.map((item, idx) => (
                        <TableRow key={item.id} data-testid={`row-item-${idx}`}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.productionLine || "-"}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.productionCapacity || "-"}</TableCell>
                          <TableCell className="font-semibold">{item.requestedQuantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {doc.qrCodeData && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="p-3 bg-white rounded-md border">
                  <img src={doc.qrCodeData} alt="QR Code" className="w-40 h-40" data-testid="img-qr-code" />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  امسح رمز QR للتحقق من صحة الوثيقة لدى الجهات المرتبطة بالنظام
                </p>
              </div>
            )}

            {doc.notes && (
              <div className="p-3 rounded-md bg-muted/40">
                <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                <p className="text-sm">{doc.notes}</p>
              </div>
            )}

            <div className="text-center text-xs text-muted-foreground pt-4 border-t space-y-1">
              <p>إن احتفاظك بهذه الوثيقة يمكّنك من استخدامها لدى الجهات المرتبطة بالنظام</p>
              <p>يمكنك حفظ صورة الوثيقة في الهاتف لاستخدامها عند الحاجة</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-md bg-muted/40">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
