import { useLocation, Link } from "wouter";
import { FileText, Building2, QrCode, Search, LayoutDashboard, Shield, Wallet } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "لوحة التحكم", url: "/", icon: LayoutDashboard },
  { title: "الشركات", url: "/companies", icon: Building2 },
  { title: "الوثائق", url: "/documents", icon: FileText },
  { title: "إنشاء وثيقة", url: "/documents/new", icon: QrCode },
  { title: "التحقق من وثيقة", url: "/verify", icon: Search },
  { title: "الحسابات", url: "/accounting", icon: Wallet },
  { title: "Proof of Work", url: "/proof-of-work", icon: Shield },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar side="right">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src="/images/customes-logo.png" alt="Logo" className="w-10 h-10 rounded-md" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-foreground">نظام الكمارك</span>
            <span className="text-xs text-sidebar-foreground/60">إدارة الوثائق و QR</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url || (item.url !== "/" && location.startsWith(item.url))}
                  >
                    <Link href={item.url} data-testid={`nav-${item.url.replace(/\//g, '-')}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="text-xs text-sidebar-foreground/50 text-center">
          الهيئة العامة للكمارك
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
