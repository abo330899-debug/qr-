import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams } from "wouter";
import { ArrowRight, Download, Printer, FileText, ExternalLink } from "lucide-react";
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

  const dateStr = new Date(doc.createdAt).toLocaleDateString('ar-IQ', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeStr = new Date(doc.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
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
        <div className="bg-[#f3f4f6] p-4 flex justify-center print:p-0 print:bg-white">
          <div className="bg-white border border-[#d4cece] shadow-md w-full max-w-[210mm] min-h-[297mm] p-[8mm] flex flex-col gap-2.5 print:shadow-none print:border-none print:p-[10mm]" dir="rtl">
            <header className="grid grid-cols-[1fr_150px_1fr] items-center gap-2 py-1">
              <div className="text-right">
                <div className="text-xs leading-relaxed">
                  <div>جمهورية العراق</div>
                  <div>وزارة المالية</div>
                  <div>الهيئــة العامــة للكمـــارك</div>
                </div>
              </div>
              <div className="flex justify-center">
                <img src="/images/customes-logo.png" alt="Logo" className="w-[110px] h-[110px] object-contain rounded-full border-[3px] border-[#bbb] p-1.5 bg-white" />
              </div>
              <div className="text-left">
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2 items-center justify-between">
                    <span className="font-bold whitespace-nowrap text-xs">رقم الوثيقة</span>
                    <span className="text-xs break-all" dir="ltr" data-testid="text-doc-number">{doc.documentNumber}</span>
                  </div>
                  <div className="flex gap-2 items-center justify-between">
                    <span className="font-bold whitespace-nowrap text-xs">تاريخ إنشاء الوثيقة</span>
                    <span className="text-xs" dir="ltr">{dateStr}</span>
                  </div>
                  <div className="flex gap-2 items-center justify-between">
                    <span className="font-bold whitespace-nowrap text-xs">التوقيت</span>
                    <span className="text-xs" dir="ltr">{timeStr}</span>
                  </div>
                </div>
                <div className="mt-2 print:hidden">
                  <button type="button" onClick={handlePrint} className="bg-[#0d6efd] text-white border-none py-1.5 px-2.5 rounded-md font-bold cursor-pointer text-xs shadow-sm hover:opacity-95">
                    طباعة الوثيقة
                  </button>
                </div>
              </div>
            </header>

            <hr className="border-t border-black/10 my-1" />

            <div className="flex-1 flex flex-col gap-2.5">
              <h2 className="text-center text-lg font-bold my-1">منصة المنتج المحلي</h2>

              {doc.subject && (
                <div className="flex gap-3 items-center flex-wrap">
                  <strong className="text-sm">الموضوع /</strong>
                  <div className="flex-1 bg-[#f6f6f6] rounded-md py-1.5 px-2.5 font-semibold min-w-[200px] text-sm">{doc.subject}</div>
                </div>
              )}

              <div dir="rtl">
                <table className="w-full border-collapse text-sm">
                  <colgroup>
                    <col style={{ width: "35%" }} />
                    <col style={{ width: "65%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th colSpan={2} className="bg-[#990707] text-white text-center py-1 px-1.5 border border-[#bbb]">المعلومات الشخصية</th>
                    </tr>
                  </thead>
                  <tbody>
                    <DocRow label="اسم سيطرة الدخول" value={doc.checkpointNameControl} />
                    <DocRow label="اسم السائق" value={doc.driverName} />
                    <DocRow label="رقم العجلة" value={doc.vehicleNumber} />
                    <DocRow label="محافظة تسجيل العجلة" value={doc.registrationGovernorate} />
                    <DocRow label="نوع / تفاصيل الحمولة" value={doc.cargoTypedetails} />
                    <DocRow label="الوزن / الكمية" value={doc.weightQuantity} />
                    <DocRow label="الوجهة النهائية / المحافظة" value={doc.destinationGovernorate} />
                    <DocRow label="اسم المحافظة" value={doc.governorateName} />
                    <DocRow label="اسم الشركة / المشروع" value={doc.companyNameProject || doc.companyName} />
                    <DocRow label="الجهة المانحة للإجازة / الموافقة" value={doc.grantingLicenseApproval} />
                    <DocRow label="رقم الإجازة / الموافقة" value={doc.licenseApprovalNumber || doc.licenceNumber} />
                    <DocRow label="تاريخ الإجازة / الموافقة" value={doc.licenseApprovalDate} />
                    <DocRow label="منطوق الإجازة / الاختصاص" value={doc.licenseTextSpecialization} />
                    <DocRow label="العلامة التجارية" value={doc.brand} />
                    {doc.items && doc.items.length > 0 && (
                      <>
                        <tr>
                          <th colSpan={2} className="bg-[#990707] text-white text-center py-1 px-1.5 border border-[#bbb] font-bold">المواد / المنتجات المرخَّصة</th>
                        </tr>
                        {doc.items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="border border-[#bbb] py-1 px-1.5">{item.itemName}</td>
                            <td className="border border-[#bbb] py-1 px-1.5" style={{ direction: 'ltr', textAlign: 'right' }}>
                              {item.productionCapacity} {item.unit}
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {doc.qrCodeData && (
                <div className="flex justify-center mt-4">
                  <img src={doc.qrCodeData} alt="QR" className="w-[58mm] max-w-full bg-white border border-black/5 p-1.5" data-testid="img-qr-code" crossOrigin="anonymous" />
                </div>
              )}

              <div className="text-center text-xs text-gray-500 mt-2 space-y-1">
                <p>إن احتفاظك بهذه الوثيقة يمكّنك من استخدامها لدى الجهات المرتبطة بالنظام.</p>
                <p>يمكنك حفظ صورة الوثيقة في الهاتف لاستخدامها عند الحاجة.</p>
                {doc.xCoordinate && doc.yCoordinate && (
                  <p>
                    <a
                      href={`https://www.google.com/maps?q=${doc.xCoordinate},${doc.yCoordinate}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0d6efd] font-bold inline-flex items-center gap-1"
                    >
                      <span>{doc.xCoordinate}, {doc.yCoordinate}</span>
                      <ExternalLink className="h-3 w-3 inline" />
                    </a>
                  </p>
                )}
                <p className="text-gray-400">
                  لمزيد من المعلومات عن الخدمات الحكومية الإلكترونية يمكن زيارة:{" "}
                  <a href="https://ur.gov.iq" target="_blank" rel="noopener noreferrer" className="text-[#0d6efd] font-bold">https://ur.gov.iq</a>
                </p>
              </div>
            </div>

            <footer className="flex items-center justify-between gap-2.5 border-t border-[#bbb] pt-2 flex-wrap mt-auto">
              <div>
                <img src="/images/ur-logo.png" alt="Logo" className="w-[72px] h-[56px] object-contain" />
              </div>
              <div className="text-center">
                <div className="text-xs font-bold">مكتب رئيس الوزراء / المركز الوطني للتحول الرقمي</div>
                <div className="text-xs">بغداد – كرادة مريم</div>
                <div className="text-xs">المركز الوطني للتحول الرقمي @2025</div>
              </div>
              <div className="text-left" dir="ltr">
                <div className="text-xs">Prime Minister's Office</div>
                <div className="text-xs">National Center for Digital Transformation</div>
                <div className="text-xs">Tel: 5599</div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <tr>
      <td className="border border-[#bbb] py-1 px-1.5 font-medium text-sm">{label}</td>
      <td className="border border-[#bbb] py-1 px-1.5 text-sm">{value || ""}</td>
    </tr>
  );
}
