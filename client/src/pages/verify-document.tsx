import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { Search, CheckCircle2, XCircle, Building2, Truck, MapPin, QrCode, Loader2, Shield, ExternalLink } from "lucide-react";
import type { Document, DocumentItem } from "@shared/schema";

interface VerifyResult extends Document {
  items: DocumentItem[];
  valid: boolean;
}

export default function VerifyDocument() {
  const { toast } = useToast();
  const params = useParams<{ documentNumber?: string }>();
  const [documentNumber, setDocumentNumber] = useState(params.documentNumber || "");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const doVerify = useCallback(async (docNum: string) => {
    if (!docNum.trim()) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    try {
      const res = await fetch(`/api/documents/verify/${encodeURIComponent(docNum.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setNotFound(true);
      }
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ في الاتصال", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (params.documentNumber) {
      setDocumentNumber(params.documentNumber);
      doVerify(params.documentNumber);
    }
  }, [params.documentNumber, doVerify]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentNumber.trim()) {
      toast({ title: "خطأ", description: "الرجاء إدخال رقم الوثيقة", variant: "destructive" });
      return;
    }
    doVerify(documentNumber);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">التحقق من وثيقة</h1>
        <p className="text-muted-foreground text-sm">أدخل رقم الوثيقة للتحقق من صحتها ومعلوماتها</p>
      </div>

      <Card>
        <CardContent className="py-8">
          <form onSubmit={handleVerify} className="flex flex-col items-center gap-6 max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <QrCode className="h-10 w-10 text-primary" />
            </div>
            <div className="w-full space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-document-number"
                  className="pr-10 text-center text-lg"
                  placeholder="أدخل رقم الوثيقة (مثال: DOC-20250225-ABC123)"
                  value={documentNumber}
                  onChange={e => setDocumentNumber(e.target.value)}
                  dir="ltr"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading} data-testid="button-verify">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 ml-2" />
                    التحقق من الوثيقة
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {notFound && (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center py-10 gap-3">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold">الوثيقة غير موجودة</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              لم يتم العثور على وثيقة بهذا الرقم. تأكد من صحة الرقم وحاول مرة أخرى.
            </p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base" data-testid="text-verified-title">وثيقة صحيحة ومعتمدة</CardTitle>
                  <p className="text-xs text-muted-foreground">تم التحقق من صحة الوثيقة بنجاح</p>
                </div>
              </div>
              <Badge variant="default">تم التحقق</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="رقم الوثيقة" value={result.documentNumber} />
              <InfoField label="تاريخ الإنشاء" value={new Date(result.createdAt).toLocaleDateString('ar-IQ')} />
            </div>

            {result.subject && (
              <div className="p-3 rounded-md bg-muted/40">
                <p className="text-xs text-muted-foreground mb-1">الموضوع</p>
                <p className="text-sm font-semibold">{result.subject}</p>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                معلومات الشركة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoField label="اسم الشركة / المشروع" value={result.companyNameProject || result.companyName} />
                <InfoField label="اسم المحافظة" value={result.governorateName || "-"} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                المعلومات الشخصية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoField label="اسم سيطرة الدخول" value={result.checkpointNameControl} />
                <InfoField label="اسم السائق" value={result.driverName} />
                <InfoField label="رقم العجلة" value={result.vehicleNumber} />
                <InfoField label="محافظة تسجيل العجلة" value={result.registrationGovernorate || "-"} />
                <InfoField label="نوع / تفاصيل الحمولة" value={result.cargoTypedetails || "-"} />
                <InfoField label="الوزن / الكمية" value={result.weightQuantity} />
                <InfoField label="الوجهة النهائية / المحافظة" value={result.destinationGovernorate || "-"} />
                <InfoField label="العلامة التجارية" value={result.brand || "-"} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                معلومات الإجازة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoField label="الجهة المانحة للإجازة" value={result.grantingLicenseApproval || "-"} />
                <InfoField label="رقم الإجازة / الموافقة" value={result.licenseApprovalNumber || result.licenceNumber} />
                <InfoField label="تاريخ الإجازة" value={result.licenseApprovalDate || "-"} />
                <InfoField label="منطوق الإجازة / الاختصاص" value={result.licenseTextSpecialization || "-"} />
              </div>
            </div>

            {result.xCoordinate && result.yCoordinate && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  الموقع الجغرافي
                </h3>
                <div className="p-3 rounded-md bg-muted/40">
                  <a
                    href={`https://www.google.com/maps?q=${result.xCoordinate},${result.yCoordinate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0d6efd] font-bold inline-flex items-center gap-1"
                  >
                    <span>{result.xCoordinate}, {result.yCoordinate}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {result.items && result.items.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">المواد / المنتجات المرخَّصة</h3>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#990707] text-white">
                        <th className="py-1.5 px-3 text-right border border-[#bbb]">المادة</th>
                        <th className="py-1.5 px-3 text-left border border-[#bbb]">الطاقة الإنتاجية</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.items.map((item, idx) => (
                        <tr key={item.id || idx} className="even:bg-muted/30">
                          <td className="py-1.5 px-3 border border-[#bbb]">{item.itemName}</td>
                          <td className="py-1.5 px-3 border border-[#bbb]" dir="ltr" style={{ textAlign: 'right' }}>
                            {item.productionCapacity} {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.qrCodeData && (
              <div className="flex flex-col items-center gap-2 pt-4">
                <div className="p-2 bg-white rounded-md border">
                  <img src={result.qrCodeData} alt="QR" className="w-28 h-28" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
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
