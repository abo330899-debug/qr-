import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, Play, RotateCcw } from "lucide-react";

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default function ProofOfWork() {
  const [challenge, setChallenge] = useState(
    "812a699e162dc6c3689f5b2a4953d7a90f6caf200ba2db31aca26e46299c9a3e"
  );
  const [salt, setSalt] = useState(
    "f5b32c81f1e58482f43f4594?expires=1773421135&"
  );
  const [maxNumber, setMaxNumber] = useState(1000000);

  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState("جاهز");
  const [currentNumber, setCurrentNumber] = useState(0);
  const [elapsedTime, setElapsedTime] = useState("0.00 ثانية");
  const [progress, setProgress] = useState(0);
  const [resultText, setResultText] = useState("لم يبدأ الحل بعد.");

  const isRunningRef = useRef(false);

  const solveProofOfWork = useCallback(async () => {
    if (isRunningRef.current) return;

    const challengeVal = challenge.trim().toLowerCase();
    const saltVal = salt.trim();
    const maxNum = maxNumber;

    const sha256Regex = /^[a-f0-9]{64}$/;
    if (!sha256Regex.test(challengeVal)) {
      setResultText("خطأ: قيمة Challenge يجب أن تكون SHA-256 hex بطول 64 حرف.");
      return;
    }
    if (!saltVal) {
      setResultText("خطأ: حقل Salt فارغ.");
      return;
    }
    if (!Number.isInteger(maxNum) || maxNum < 0) {
      setResultText("خطأ: Max Number يجب أن يكون رقمًا صحيحًا غير سالب.");
      return;
    }

    isRunningRef.current = true;
    setIsRunning(true);
    setStatusText("جاري الحل...");
    setResultText("بدأ البحث عن الرقم الصحيح...");
    setProgress(0);
    setCurrentNumber(0);
    setElapsedTime("0.00 ثانية");

    const startedAt = performance.now();

    try {
      for (let i = 0; i <= maxNum; i++) {
        const textToHash = saltVal + i;
        const hash = await sha256(textToHash);

        if (i % 5000 === 0) {
          setCurrentNumber(i);
          const percent = maxNum === 0 ? 0 : (i / maxNum) * 100;
          setProgress(Math.min(percent, 100));
          const seconds = (performance.now() - startedAt) / 1000;
          setElapsedTime(`${seconds.toFixed(2)} ثانية`);
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        if (hash === challengeVal) {
          setCurrentNumber(i);
          setProgress(100);
          const totalSeconds = (performance.now() - startedAt) / 1000;
          setElapsedTime(`${totalSeconds.toFixed(2)} ثانية`);
          setStatusText("تم العثور على الحل");
          setResultText(
            `تم العثور على الحل بنجاح.\n\n` +
              `الرقم الصحيح: ${i}\n` +
              `الوقت المستغرق: ${totalSeconds.toFixed(2)} ثانية\n` +
              `النص الذي حقق التطابق:\n${saltVal}${i}\n\n` +
              `SHA-256:\n${hash}`
          );
          isRunningRef.current = false;
          setIsRunning(false);
          return;
        }
      }

      setStatusText("لم يتم العثور على حل");
      setResultText("انتهى الفحص بالكامل ولم يتم العثور على أي رقم مطابق.");
    } catch (error: any) {
      console.error(error);
      setStatusText("حدث خطأ");
      setResultText(`حدث خطأ أثناء التنفيذ:\n${error.message}`);
    } finally {
      isRunningRef.current = false;
      setIsRunning(false);
    }
  }, [challenge, salt, maxNumber]);

  const resetUI = useCallback(() => {
    if (isRunningRef.current) return;
    setStatusText("جاهز");
    setCurrentNumber(0);
    setElapsedTime("0.00 ثانية");
    setProgress(0);
    setResultText("لم يبدأ الحل بعد.");
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">
          حل لغز Proof of Work
        </h1>
        <p className="text-muted-foreground text-sm">
          الصفحة تبحث عن الرقم الذي يحقق معادلة SHA-256 المطلوبة.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            إعدادات اللغز
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="challenge">Challenge</Label>
            <Textarea
              id="challenge"
              data-testid="input-challenge"
              rows={3}
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              disabled={isRunning}
              className="font-mono text-sm"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salt">Salt</Label>
            <Input
              id="salt"
              data-testid="input-salt"
              type="text"
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              disabled={isRunning}
              className="font-mono text-sm"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxNumber">Max Number</Label>
            <Input
              id="maxNumber"
              data-testid="input-max-number"
              type="number"
              value={maxNumber}
              onChange={(e) => setMaxNumber(Number(e.target.value))}
              disabled={isRunning}
              min={0}
              dir="ltr"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={solveProofOfWork}
              disabled={isRunning}
              data-testid="button-start-solve"
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              ابدأ الحل
            </Button>
            <Button
              onClick={resetUI}
              disabled={isRunning}
              variant="outline"
              data-testid="button-reset"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">حالة التنفيذ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">الحالة</span>
              <Badge
                variant={
                  statusText === "تم العثور على الحل"
                    ? "default"
                    : statusText === "جاري الحل..."
                    ? "secondary"
                    : statusText === "حدث خطأ" || statusText === "لم يتم العثور على حل"
                    ? "destructive"
                    : "outline"
                }
                className="w-fit"
                data-testid="text-status"
              >
                {statusText}
              </Badge>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">آخر رقم تم فحصه</span>
              <strong className="text-sm" data-testid="text-current-number" dir="ltr">
                {currentNumber.toLocaleString("en-US")}
              </strong>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">الوقت المستغرق</span>
              <strong className="text-sm" data-testid="text-elapsed-time">
                {elapsedTime}
              </strong>
            </div>
          </div>

          <Progress value={progress} className="h-2" data-testid="progress-bar" />

          <div
            className="rounded-lg border bg-muted/50 p-4 whitespace-pre-wrap font-mono text-sm leading-relaxed"
            dir="ltr"
            data-testid="text-result"
          >
            {resultText}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
