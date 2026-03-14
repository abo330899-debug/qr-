import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import "./verify-document.css";

interface VerifyData {
  success: boolean;
  data: {
    info: {
      fullName: string;
      orgName: string;
      orgPathInfo: string;
    };
    numberOfVersion: number;
    showIn: boolean;
    documentFilePath: string;
  };
  document: any;
  valid: boolean;
}

function QrScanner({ onScan }: { onScan: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setActive(false);
  }, []);

  const paintCenterText = useCallback((barcodes: any[], video: HTMLVideoElement) => {
    const canvas = canvasOverlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const barcode of barcodes) {
      const { boundingBox, rawValue } = barcode;
      if (!boundingBox) continue;
      const cx = boundingBox.x + boundingBox.width / 2;
      const cy = boundingBox.y + boundingBox.height / 2;
      const fontSize = Math.max(12, 50 * boundingBox.width / canvas.width);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#35495e";
      ctx.strokeText(rawValue, cx, cy);
      ctx.fillStyle = "#5cb984";
      ctx.fillText(rawValue, cx, cy);
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      scanningRef.current = true;

      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const scan = async () => {
          if (!scanningRef.current || !videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              paintCenterText(barcodes, videoRef.current);
              const raw = barcodes[0].rawValue;
              setTimeout(() => {
                stopCamera();
                onScan(raw);
              }, 300);
              return;
            }
          } catch {}
          if (scanningRef.current) requestAnimationFrame(scan);
        };
        requestAnimationFrame(scan);
      } else {
        const { Html5Qrcode } = await import("html5-qrcode");
        const containerId = 'qr-reader-hidden-' + Date.now();
        const container = document.createElement('div');
        container.id = containerId;
        container.style.display = 'none';
        document.body.appendChild(container);
        const html5QrCode = new Html5Qrcode(containerId);

        const cleanupFallback = () => {
          try { html5QrCode.clear(); } catch {}
          try { container.remove(); } catch {}
        };

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const pollScan = async () => {
          if (!scanningRef.current || !videoRef.current) {
            cleanupFallback();
            return;
          }
          const video = videoRef.current;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            try {
              const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(b => b ? resolve(b) : reject(), 'image/png');
              });
              const file = new File([blob], 'frame.png', { type: 'image/png' });
              const result = await html5QrCode.scanFileV2(file, false);
              if (result) {
                cleanupFallback();
                stopCamera();
                onScan(result.decodedText);
                return;
              }
            } catch {}
          }
          if (scanningRef.current) setTimeout(pollScan, 500);
        };
        pollScan();
      }
    } catch (err: any) {
      setError("لا يمكن الوصول إلى الكاميرا. تأكد من إعطاء الإذن.");
      setActive(false);
    }
  }, [onScan, stopCamera, paintCenterText]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  return (
    <div className="outcamera" id="camera">
      <div className="camera" id="camera2">
        {active && (
          <div style={{ position: 'relative' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', maxHeight: 300 }}
              playsInline
              muted
              data-testid="video-qr-scanner"
            />
            <canvas
              ref={canvasOverlayRef}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            />
          </div>
        )}
      </div>
      <div className="form-group row" style={{ justifyContent: 'center', marginTop: 10 }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: 200, marginBottom: 20 }}
          onClick={active ? stopCamera : startCamera}
          data-testid="button-scan-qr"
        >
          {active ? "ايقاف  الكاميرا" : "تشغيل الكاميرا"}
        </button>
      </div>
      {error && <p style={{ color: '#DC3545', textAlign: 'center', fontSize: 14 }}>{error}</p>}
    </div>
  );
}

export default function VerifyDocument() {
  const { toast } = useToast();
  const params = useParams<{ documentNumber?: string; qrcode?: string }>();
  const initialCode = params.documentNumber || params.qrcode || "";
  const [qrCode, setQrCode] = useState(initialCode);
  const [result, setResult] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOrgPath, setShowOrgPath] = useState(false);

  const doVerify = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/documents/verify/${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data: VerifyData = await res.json();
        if (data.success) {
          setResult(data);
        } else {
          toast({ title: "خطأ", description: "الوثيقة غير موجودة", variant: "destructive" });
        }
      } else {
        toast({ title: "خطأ", description: "الوثيقة غير موجودة", variant: "destructive" });
      }
    } catch {
      toast({ title: "خطأ", description: "حدث خطأ في الاتصال", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const code = params.documentNumber || params.qrcode || "";
    if (code) {
      setQrCode(code);
      doVerify(code);
    }
  }, [params.documentNumber, params.qrcode, doVerify]);

  const handleDecode = (scannedText: string) => {
    let docNum = scannedText;
    try {
      const url = new URL(scannedText);
      const parts = url.pathname.split('/');
      const verifyIdx = parts.indexOf('verify');
      if (verifyIdx !== -1 && parts[verifyIdx + 1]) {
        docNum = decodeURIComponent(parts[verifyIdx + 1]);
      }
      const qrParam = parts.indexOf('qrpubliclink');
      if (qrParam !== -1 && parts[qrParam + 1]) {
        docNum = decodeURIComponent(parts[qrParam + 1]);
      }
    } catch {}
    setQrCode(docNum);
    doVerify(docNum);
  };

  const handleSubmit = () => {
    if (qrCode.trim().length < 12) return;
    doVerify(qrCode);
  };

  const openInNewWindow = (url: string) => {
    window.open(url, '_blank');
  };

  const documentViewUrl = result?.data?.documentFilePath || '';

  return (
    <div className="qr-public-page rtl" dir="rtl">
      <div className="row qr-main-row">
        <div className="box col-lg-6 col-md-6 col-sm-12" id="colum">
          <div className="banner">
            <img
              style={{ padding: 8 }}
              src="/images/customes-logo.png"
              alt="عرض"
              title="عرض"
              className="banner-icon"
            />
            <span className="font"> قراءة رمز الاستجابة السريعة</span>
          </div>

          <QrScanner onScan={handleDecode} />

          <div className="form-group row" style={{ alignItems: 'center', gap: 10, padding: '0 15px' }}>
            <div className="col-sm-4" style={{ textAlign: 'center' }}>
              <label
                className="col-form-label"
                style={{ color: 'rgb(44,125,191)', fontSize: '1.3rem' }}
                htmlFor="QR"
              >
                رمز الاستجابة السريعة
              </label>
            </div>
            <div className="col-sm-6">
              <input
                className="form-control input-field"
                type="text"
                placeholder="رمز الاستجابة السريعة"
                value={qrCode}
                onChange={e => setQrCode(e.target.value)}
                onKeyUp={e => { if (e.key === 'Enter') handleSubmit(); }}
                data-testid="input-document-number"
              />
              {qrCode.length > 0 && qrCode.length < 12 && (
                <i style={{ color: '#B88B7D', fontSize: 12 }}>
                  يجب ان لايقل رمز الاستجابة السريعة عن 12 رقم
                </i>
              )}
            </div>
            <div className="col-sm-2">
              <button
                className="btn btn-red"
                type="submit"
                onClick={handleSubmit}
                disabled={loading || qrCode.length < 12}
                data-testid="button-verify"
              >
                {loading ? "جاري..." : "قراءة"}
              </button>
            </div>
          </div>

          {result && result.success && (
            <>
              <hr />
              <div style={{ marginRight: 50 }}>
                <table
                  className="table table-hover table-borderless"
                  style={{ width: '50%' }}
                  aria-hidden="true"
                >
                  <tbody>
                    <tr>
                      <td style={{ color: '#04408B' }}>اسم الموظف:</td>
                      <td data-testid="text-fullname">{result.data.info.fullName}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#04408B' }}>اسم التشكيل:</td>
                      <td title={result.data.info.orgPathInfo} data-testid="text-orgname">
                        {result.data.info.orgName}
                      </td>
                      <td>
                        <a
                          style={{ color: 'rgb(44,125,191)', fontSize: 14, cursor: 'pointer' }}
                          onClick={() => setShowOrgPath(!showOrgPath)}
                        >
                          المزيد ...
                        </a>
                        {showOrgPath && (
                          <div className="mt-1">
                            <p className="description">{result.data.info.orgPathInfo}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: '#04408B' }}>عدد تعديلات الوثيقة :</td>
                      <td title={String(result.data.numberOfVersion)} data-testid="text-version-count">
                        {result.data.numberOfVersion}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div
          className="col-sm-12 col-md-10 col-lg-6 mt-2"
          style={{ marginLeft: 'auto', marginRight: 'auto' }}
        >
          {result && result.success && (
            <>
              <span> عرض الملف بنافذة جديدة :</span>
              <button
                className="btnload"
                type="button"
                onClick={() => openInNewWindow(documentViewUrl)}
                data-testid="button-open-new-window"
              >
                اضغط هنا
              </button>
              <br /><br />
              <iframe
                className="framediv desktop-pdf"
                name="iframe_qr"
                width="95%"
                height="90%"
                src={documentViewUrl}
                title="document"
                style={{ minHeight: 600, border: '1px solid #ddd' }}
                data-testid="iframe-document-preview"
              />
            </>
          )}
        </div>
      </div>

      <footer className="qr-footer" id="footer">
        <div className="footer-bottom">
          <div style={{ width: '100%' }}>
            <div className="col col-sm-10 col-md-10">
              <div className="row col-sm-12">
                <div className="col-sm-6" style={{ float: 'right' }}>
                  <p>مكتب رئيس مجلس الوزراء / المركز الوطني للتحول الرقمي © 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
