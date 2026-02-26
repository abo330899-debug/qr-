import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams } from "wouter";
import { ArrowRight, Download, Printer, FileText } from "lucide-react";
import { Link } from "wouter";
import type { Document, DocumentItem } from "@shared/schema";
import "./document-view.css";

interface DocumentWithItems extends Document {
  items: DocumentItem[];
}

export default function DocumentView() {
  const params = useParams<{ id: string }>();

  const { data: doc, isLoading, error } = useQuery<DocumentWithItems>({
    queryKey: ["/api/documents", params.id],
  });

  const handlePrint = () => {
    const docEl = document.querySelector('.qr-document-root');
    if (!docEl) { window.print(); return; }

    const html = docEl.outerHTML;
    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) return;

    const styles: string[] = [];
    styles.push('<meta charset="utf-8" />');
    styles.push('<title>طباعة الوثيقة</title>');
    document.querySelectorAll('style').forEach(s => styles.push(s.outerHTML));
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const sep = href.includes('?') ? '&' : '?';
      styles.push(`<link rel="stylesheet" href="${href}${sep}print_copy=${Date.now()}" />`);
    });

    win.document.open();
    win.document.write(`
      <!doctype html>
      <html dir="rtl" lang="ar">
        <head>
          ${styles.join('\n')}
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); win.close(); };
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
  const items = doc.items || [];

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

      <div className="qr-document-root">
        <div className="doc-viewport">
          <div className="a4-page" dir="rtl">
            <header className="header-clean">
              <div className="header-right">
                <div className="office-lines small">
                  <div style={{ textAlign: 'right' }}>جمهورية العراق</div>
                  <div style={{ textAlign: 'right' }}>وزارة المالية</div>
                  <div style={{ textAlign: 'right' }}>الهيئــة العامــة للكمـــارك</div>
                </div>
              </div>
              <div className="header-center logo-wrap">
                <img src="/images/customes-logo.png" alt="Logo" className="center-logo" />
              </div>
              <div className="header-left">
                <div className="doc-meta">
                  <div className="meta-line">
                    <span className="meta-label">رقم الوثيقة</span>
                    <span className="meta-value" data-testid="text-doc-number">{doc.documentNumber}</span>
                  </div>
                  <div className="meta-line">
                    <span className="meta-label">تاريخ إنشاء الوثيقة</span>
                    <span className="meta-value">{dateStr}</span>
                  </div>
                  <div className="meta-line">
                    <span className="meta-label">التوقيت</span>
                    <span className="meta-value">{timeStr}</span>
                  </div>
                </div>
                <div className="doc-actions">
                  <button type="button" className="print-btn" title="طباعة الوثيقة" onClick={handlePrint}>
                    طباعة الوثيقة
                  </button>
                </div>
              </div>
            </header>

            <hr className="divider" />

            <div className="content">
              <h2 className="doc-title">منصة المنتج المحلي</h2>

              {doc.subject && (
                <div className="subject-row">
                  <strong>الموضوع /</strong>
                  <div className="subject-field">{doc.subject}</div>
                </div>
              )}

              <div className="info-section" dir="rtl">
                <table className="info-table">
                  <colgroup>
                    <col style={{ width: '35%' }} />
                    <col style={{ width: '65%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th colSpan={2}>المعلومات الشخصية</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>اسم سيطرة الدخول</td><td>{doc.checkpointNameControl || ''}</td></tr>
                    <tr><td>اسم السائق</td><td>{doc.driverName || ''}</td></tr>
                    <tr><td>رقم العجلة</td><td>{doc.vehicleNumber || ''}</td></tr>
                    <tr><td>محافظة تسجيل العجلة</td><td>{doc.registrationGovernorate || ''}</td></tr>
                    <tr><td>نوع / تفاصيل الحمولة</td><td>{doc.cargoTypedetails || ''}</td></tr>
                    <tr><td>الوزن / الكمية</td><td>{doc.weightQuantity || ''}</td></tr>
                    <tr><td>الوجهة النهائية / المحافظة</td><td>{doc.destinationGovernorate || ''}</td></tr>
                    <tr><td>اسم المحافظة</td><td>{doc.governorateName || ''}</td></tr>
                    <tr><td>اسم الشركة / المشروع</td><td>{doc.companyNameProject || doc.companyName || ''}</td></tr>
                    <tr><td>الجهة المانحة للإجازة / الموافقة</td><td>{doc.grantingLicenseApproval || ''}</td></tr>
                    <tr><td>رقم الإجازة / الموافقة</td><td>{doc.licenseApprovalNumber || doc.licenceNumber || ''}</td></tr>
                    <tr><td>تاريخ الإجازة / الموافقة</td><td>{doc.licenseApprovalDate || ''}</td></tr>
                    <tr><td>منطوق الإجازة / الاختصاص</td><td>{doc.licenseTextSpecialization || ''}</td></tr>
                    <tr><td>العلامة التجارية</td><td>{doc.brand || ''}</td></tr>
                    {items.length > 0 && (
                      <>
                        <tr>
                          <th colSpan={2} className="info-header">المواد / المنتجات المرخَّصة</th>
                        </tr>
                        {items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td>{item.itemName}</td>
                            <td style={{ direction: 'ltr', textAlign: 'right' }}>
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
                <div className="qr-wrap large-qr">
                  <img src={doc.qrCodeData} alt="QR" className="barcode-img" data-testid="img-qr-code" crossOrigin="anonymous" />
                </div>
              )}

              <div className="notes centered">
                <div style={{ textAlign: 'center' }}>
                  <p>إن احتفاظك بهذه الوثيقة يمكّنك من استخدامها لدى الجهات المرتبطة بالنظام.</p>
                  <p>يمكنك حفظ صورة الوثيقة في الهاتف لاستخدامها عند الحاجة.</p>
                  {doc.xCoordinate && doc.yCoordinate && (
                    <p>
                      <a
                        href={`https://www.google.com/maps?q=${doc.xCoordinate},${doc.yCoordinate}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link"
                      >
                        {doc.xCoordinate}, {doc.yCoordinate} ↗
                      </a>
                    </p>
                  )}
                  <p className="muted">
                    لمزيد من المعلومات عن الخدمات الحكومية الإلكترونية يمكن زيارة:{" "}
                    <a href="https://ur.gov.iq" target="_blank" rel="noopener noreferrer" className="external-link">
                      https://ur.gov.iq
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <footer className="doc-footer">
              <div className="footer-left">
                <img src="/images/ur-logo.png" alt="Logo" className="footer-logo" />
              </div>
              <div className="footer-center">
                <div className="small"><strong>مكتب رئيس الوزراء / المركز الوطني للتحول الرقمي</strong></div>
                <div className="small">بغداد – كرادة مريم</div>
                <div className="small">المركز الوطني للتحول الرقمي @2025</div>
              </div>
              <div className="footer-right en-footer" dir="ltr">
                <div className="small">Prime Minister's Office</div>
                <div className="small">National Center for Digital Transformation</div>
                <div className="small">Tel: 5599</div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
