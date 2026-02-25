import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Plus, Phone, Mail, MapPin, Edit, Trash2 } from "lucide-react";
import type { Company } from "@shared/schema";

export default function Companies() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    licenseNumber: "",
    specialization: "",
    governorate: "",
    address: "",
    phone: "",
    email: "",
  });

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/companies", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "تم إنشاء الشركة بنجاح" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof form }) => {
      const res = await apiRequest("PATCH", `/api/companies/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "تم تحديث الشركة بنجاح" });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({ title: "تم حذف الشركة بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm({ companyName: "", licenseNumber: "", specialization: "", governorate: "", address: "", phone: "", email: "" });
    setEditingCompany(null);
    setOpen(false);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setForm({
      companyName: company.companyName,
      licenseNumber: company.licenseNumber,
      specialization: company.specialization,
      governorate: company.governorate,
      address: company.address || "",
      phone: company.phone || "",
      email: company.email || "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.licenseNumber || !form.specialization || !form.governorate) {
      toast({ title: "خطأ", description: "الرجاء ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">الشركات</h1>
          <p className="text-muted-foreground text-sm">إدارة الشركات المسجلة في النظام</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-company">
              <Plus className="h-4 w-4 ml-1" />
              إضافة شركة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCompany ? "تعديل الشركة" : "إضافة شركة جديدة"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>اسم الشركة *</Label>
                <Input data-testid="input-company-name" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="أدخل اسم الشركة" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>رقم الإجازة *</Label>
                  <Input data-testid="input-license-number" value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})} placeholder="رقم الإجازة" />
                </div>
                <div className="space-y-2">
                  <Label>التخصص *</Label>
                  <Input data-testid="input-specialization" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} placeholder="التخصص" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>المحافظة *</Label>
                <Input data-testid="input-governorate" value={form.governorate} onChange={e => setForm({...form, governorate: e.target.value})} placeholder="المحافظة" />
              </div>
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input data-testid="input-address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="العنوان" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>الهاتف</Label>
                  <Input data-testid="input-phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="رقم الهاتف" />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input data-testid="input-email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="البريد الإلكتروني" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-company">
                {createMutation.isPending || updateMutation.isPending ? "جاري الحفظ..." : editingCompany ? "تحديث" : "إضافة"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-md" />)}
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Building2 className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">لا توجد شركات مسجلة</p>
            <Button variant="secondary" onClick={() => setOpen(true)}>إضافة شركة</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="hover-elevate" data-testid={`card-company-${company.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm truncate">{company.companyName}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{company.licenseNumber}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">{company.specialization}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{company.governorate}{company.address ? ` - ${company.address}` : ""}</span>
                </div>
                {company.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span dir="ltr">{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span dir="ltr">{company.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(company)} data-testid={`button-edit-${company.id}`}>
                    <Edit className="h-3.5 w-3.5 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate(company.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${company.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 ml-1" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
