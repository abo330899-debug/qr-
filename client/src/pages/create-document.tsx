import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Plus, Trash2, FileText, Send } from "lucide-react";
import type { Company } from "@shared/schema";

interface ItemForm {
  itemName: string;
  productionLine: string;
  unit: string;
  productionCapacity: string;
  requestedQuantity: string;
}

export default function CreateDocument() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const [form, setForm] = useState({
    companyId: "",
    companyName: "",
    driverName: "",
    vehicleNumber: "",
    licenceNumber: "",
    checkpointName: "",
    governorate: "",
    weightQuantity: "",
    specialization: "",
    notes: "",
  });

  const [items, setItems] = useState<ItemForm[]>([
    { itemName: "", productionLine: "", unit: "طن", productionCapacity: "", requestedQuantity: "" }
  ]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/documents", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: "تم إنشاء الوثيقة بنجاح", description: `رقم الوثيقة: ${data.documentNumber}` });
      navigate(`/documents/${data.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setForm({
        ...form,
        companyId,
        companyName: company.companyName,
        governorate: company.governorate,
        specialization: company.specialization,
      });
    }
  };

  const addItem = () => {
    setItems([...items, { itemName: "", productionLine: "", unit: "طن", productionCapacity: "", requestedQuantity: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ItemForm, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyId || !form.driverName || !form.vehicleNumber || !form.licenceNumber || !form.checkpointName || !form.governorate || !form.weightQuantity) {
      toast({ title: "خطأ", description: "الرجاء ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    const validItems = items.filter(i => i.itemName && i.requestedQuantity);
    if (validItems.length === 0) {
      toast({ title: "خطأ", description: "الرجاء إضافة عنصر واحد على الأقل", variant: "destructive" });
      return;
    }
    createMutation.mutate({ ...form, items: validItems });
  };

  const checkpoints = ["نقطة أم قصر", "منفذ الشلامجة", "منفذ زرباطية", "منفذ المنذرية", "منفذ طريبيل", "منفذ عرعر", "منفذ ربيعة", "منفذ إبراهيم الخليل"];
  const governorates = ["بغداد", "البصرة", "نينوى", "أربيل", "السليمانية", "كركوك", "النجف", "كربلاء", "ذي قار", "بابل", "ديالى", "الأنبار", "واسط", "صلاح الدين", "ميسان", "المثنى", "القادسية", "دهوك"];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">إنشاء وثيقة جديدة</h1>
        <p className="text-muted-foreground text-sm">إنشاء وثيقة شحن جديدة مع رمز QR للتحقق</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              معلومات الوثيقة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>الشركة *</Label>
              <Select value={form.companyId} onValueChange={handleCompanyChange}>
                <SelectTrigger data-testid="select-company">
                  <SelectValue placeholder="اختر الشركة" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم السائق *</Label>
                <Input data-testid="input-driver-name" value={form.driverName} onChange={e => setForm({...form, driverName: e.target.value})} placeholder="اسم السائق" />
              </div>
              <div className="space-y-2">
                <Label>رقم المركبة *</Label>
                <Input data-testid="input-vehicle-number" value={form.vehicleNumber} onChange={e => setForm({...form, vehicleNumber: e.target.value})} placeholder="رقم المركبة" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الإجازة *</Label>
                <Input data-testid="input-licence-number" value={form.licenceNumber} onChange={e => setForm({...form, licenceNumber: e.target.value})} placeholder="رقم الإجازة" />
              </div>
              <div className="space-y-2">
                <Label>الوزن / الكمية *</Label>
                <Input data-testid="input-weight" value={form.weightQuantity} onChange={e => setForm({...form, weightQuantity: e.target.value})} placeholder="مثال: 25 طن" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المنفذ الكمركي *</Label>
                <Select value={form.checkpointName} onValueChange={v => setForm({...form, checkpointName: v})}>
                  <SelectTrigger data-testid="select-checkpoint">
                    <SelectValue placeholder="اختر المنفذ" />
                  </SelectTrigger>
                  <SelectContent>
                    {checkpoints.map(cp => (
                      <SelectItem key={cp} value={cp}>{cp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المحافظة *</Label>
                <Select value={form.governorate} onValueChange={v => setForm({...form, governorate: v})}>
                  <SelectTrigger data-testid="select-governorate">
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    {governorates.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea data-testid="input-notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="ملاحظات إضافية (اختياري)" className="resize-none" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">المواد / البضائع</CardTitle>
              <Button type="button" variant="secondary" size="sm" onClick={addItem} data-testid="button-add-item">
                <Plus className="h-4 w-4 ml-1" />
                إضافة مادة
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 rounded-md bg-muted/40 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">المادة {index + 1}</span>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} data-testid={`button-remove-item-${index}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">اسم المادة *</Label>
                    <Input data-testid={`input-item-name-${index}`} value={item.itemName} onChange={e => updateItem(index, 'itemName', e.target.value)} placeholder="اسم المادة" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">خط الإنتاج</Label>
                    <Input data-testid={`input-production-line-${index}`} value={item.productionLine} onChange={e => updateItem(index, 'productionLine', e.target.value)} placeholder="خط الإنتاج" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">الوحدة</Label>
                    <Select value={item.unit} onValueChange={v => updateItem(index, 'unit', v)}>
                      <SelectTrigger data-testid={`select-unit-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="طن">طن</SelectItem>
                        <SelectItem value="كغم">كغم</SelectItem>
                        <SelectItem value="قطعة">قطعة</SelectItem>
                        <SelectItem value="لتر">لتر</SelectItem>
                        <SelectItem value="متر">متر</SelectItem>
                        <SelectItem value="صندوق">صندوق</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الطاقة الإنتاجية</Label>
                    <Input data-testid={`input-capacity-${index}`} value={item.productionCapacity} onChange={e => updateItem(index, 'productionCapacity', e.target.value)} placeholder="الطاقة" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الكمية المطلوبة *</Label>
                    <Input data-testid={`input-quantity-${index}`} value={item.requestedQuantity} onChange={e => updateItem(index, 'requestedQuantity', e.target.value)} placeholder="الكمية" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-document">
          <Send className="h-4 w-4 ml-2" />
          {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الوثيقة و رمز QR"}
        </Button>
      </form>
    </div>
  );
}
