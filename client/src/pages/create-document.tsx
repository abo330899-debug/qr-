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
import { Plus, Trash2, FileText, Send, MapPin, Building2, Truck, Shield } from "lucide-react";
import type { Company } from "@shared/schema";

interface ItemForm {
  itemName: string;
  unit: string;
  productionCapacity: string;
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
    companyNameProject: "",
    subject: "",
    driverName: "",
    vehicleNumber: "",
    licenceNumber: "",
    checkpointNameControl: "",
    registrationGovernorate: "",
    cargoTypedetails: "",
    weightQuantity: "",
    destinationGovernorate: "",
    governorateName: "",
    xCoordinate: "",
    yCoordinate: "",
    grantingLicenseApproval: "",
    licenseApprovalNumber: "",
    licenseApprovalDate: "",
    licenseTextSpecialization: "",
    brand: "",
    notes: "",
  });

  const [items, setItems] = useState<ItemForm[]>([
    { itemName: "", unit: "طن", productionCapacity: "" }
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
        companyNameProject: company.companyName,
        governorateName: company.governorate,
        licenseApprovalNumber: company.licenseNumber,
        licenseTextSpecialization: company.specialization,
      });
    }
  };

  const addItem = () => {
    setItems([...items, { itemName: "", unit: "طن", productionCapacity: "" }]);
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
    if (!form.companyId || !form.driverName || !form.vehicleNumber || !form.checkpointNameControl || !form.weightQuantity) {
      toast({ title: "خطأ", description: "الرجاء ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    const validItems = items.filter(i => i.itemName && i.productionCapacity);
    if (validItems.length === 0) {
      toast({ title: "خطأ", description: "الرجاء إضافة عنصر واحد على الأقل مع الكمية", variant: "destructive" });
      return;
    }
    createMutation.mutate({ ...form, licenceNumber: form.licenseApprovalNumber || "", items: validItems });
  };

  const checkpoints = [
    "سيطرة دارمان",
    "منفذ الشلامجة",
    "نقطة أم قصر",
    "منفذ زرباطية",
    "منفذ المنذرية",
    "منفذ طريبيل",
    "منفذ عرعر",
    "منفذ ربيعة",
    "منفذ إبراهيم الخليل",
    "منفذ سفوان",
    "منفذ الوليد",
    "منفذ مندلي",
  ];

  const governorates = [
    "بغداد", "البصرة", "نينوى", "أربيل", "السليمانية", "كركوك",
    "النجف", "كربلاء", "ذي قار", "بابل", "ديالى", "الأنبار",
    "واسط", "صلاح الدين", "ميسان", "المثنى", "القادسية", "دهوك",
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">إنشاء وثيقة جديدة</h1>
        <p className="text-muted-foreground text-sm">إنشاء وثيقة شحن جديدة - منصة المنتج المحلي</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              معلومات الشركة / المشروع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>اسم المحافظة</Label>
                <Select value={form.governorateName} onValueChange={v => setForm({...form, governorateName: v})}>
                  <SelectTrigger data-testid="select-governorate-name">
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
              <Label>الموضوع</Label>
              <Input data-testid="input-subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="موضوع الوثيقة" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              المعلومات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم السائق *</Label>
                <Input data-testid="input-driver-name" value={form.driverName} onChange={e => setForm({...form, driverName: e.target.value})} placeholder="أدخل اسم السائق" />
              </div>
              <div className="space-y-2">
                <Label>رقم العجلة *</Label>
                <Input data-testid="input-vehicle-number" value={form.vehicleNumber} onChange={e => setForm({...form, vehicleNumber: e.target.value})} placeholder="أدخل رقم المركبة" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>محافظة تسجيل العجلة</Label>
                <Select value={form.registrationGovernorate} onValueChange={v => setForm({...form, registrationGovernorate: v})}>
                  <SelectTrigger data-testid="select-registration-governorate">
                    <SelectValue placeholder="أدخل محافظة التسجيل" />
                  </SelectTrigger>
                  <SelectContent>
                    {governorates.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>اسم سيطرة الدخول *</Label>
                <Select value={form.checkpointNameControl} onValueChange={v => setForm({...form, checkpointNameControl: v})}>
                  <SelectTrigger data-testid="select-checkpoint">
                    <SelectValue placeholder="اختر اسم السيطرة" />
                  </SelectTrigger>
                  <SelectContent>
                    {checkpoints.map(cp => (
                      <SelectItem key={cp} value={cp}>{cp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع / تفاصيل الحمولة</Label>
                <Textarea data-testid="input-cargo-type" value={form.cargoTypedetails} onChange={e => setForm({...form, cargoTypedetails: e.target.value})} placeholder="مثال: سمنت" className="resize-none" />
              </div>
              <div className="space-y-2">
                <Label>الوزن / الكمية *</Label>
                <Input data-testid="input-weight" value={form.weightQuantity} onChange={e => setForm({...form, weightQuantity: e.target.value})} placeholder="أدخل الوزن أو الكمية" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوجهة النهائية / المحافظة</Label>
                <Select value={form.destinationGovernorate} onValueChange={v => setForm({...form, destinationGovernorate: v})}>
                  <SelectTrigger data-testid="select-destination">
                    <SelectValue placeholder="أدخل الوجهة النهائية" />
                  </SelectTrigger>
                  <SelectContent>
                    {governorates.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>العلامة التجارية</Label>
                <Input data-testid="input-brand" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} placeholder="العلامة التجارية" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              الموقع الجغرافي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الموقع الجغرافي (X) - خط الطول</Label>
                <Input data-testid="input-x-coordinate" value={form.xCoordinate} onChange={e => setForm({...form, xCoordinate: e.target.value})} placeholder="خط الطول" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>الموقع الجغرافي (Y) - خط العرض</Label>
                <Input data-testid="input-y-coordinate" value={form.yCoordinate} onChange={e => setForm({...form, yCoordinate: e.target.value})} placeholder="خط العرض" dir="ltr" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              معلومات الإجازة / الموافقة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الجهة المانحة للإجازة</Label>
                <Input data-testid="input-granting-license" value={form.grantingLicenseApproval} onChange={e => setForm({...form, grantingLicenseApproval: e.target.value})} placeholder="الجهة المانحة للإجازة / الموافقة" />
              </div>
              <div className="space-y-2">
                <Label>رقم الإجازة / الموافقة</Label>
                <Input data-testid="input-license-number" value={form.licenseApprovalNumber} onChange={e => setForm({...form, licenseApprovalNumber: e.target.value})} placeholder="رقم الإجازة" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الإجازة / الموافقة</Label>
                <Input data-testid="input-license-date" type="date" value={form.licenseApprovalDate} onChange={e => setForm({...form, licenseApprovalDate: e.target.value})} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>منطوق الإجازة / الاختصاص</Label>
                <Input data-testid="input-license-specialization" value={form.licenseTextSpecialization} onChange={e => setForm({...form, licenseTextSpecialization: e.target.value})} placeholder="منطوق الإجازة / الاختصاص" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">المواد / المنتجات المرخَّصة</CardTitle>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">اسم المادة *</Label>
                    <Input data-testid={`input-item-name-${index}`} value={item.itemName} onChange={e => updateItem(index, 'itemName', e.target.value)} placeholder="اسم المادة" />
                  </div>
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
                        <SelectItem value="كيس">كيس</SelectItem>
                        <SelectItem value="برميل">برميل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الطاقة الإنتاجية / الكمية *</Label>
                    <Input data-testid={`input-capacity-${index}`} value={item.productionCapacity} onChange={e => updateItem(index, 'productionCapacity', e.target.value)} placeholder="الكمية" type="number" min="0" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label>ملاحظات</Label>
          <Textarea data-testid="input-notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="ملاحظات إضافية (اختياري)" className="resize-none" />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-document">
          <Send className="h-4 w-4 ml-2" />
          {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء الوثيقة و رمز QR"}
        </Button>
      </form>
    </div>
  );
}
