import { Switch, Route, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Companies from "@/pages/companies";
import Documents from "@/pages/documents";
import CreateDocument from "@/pages/create-document";
import DocumentView from "@/pages/document-view";
import VerifyDocument from "@/pages/verify-document";
import ProofOfWork from "@/pages/proof-of-work";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/companies" component={Companies} />
      <Route path="/documents" component={Documents} />
      <Route path="/documents/new" component={CreateDocument} />
      <Route path="/documents/:id" component={DocumentView} />
      <Route path="/verify" component={VerifyDocument} />
      <Route path="/verify/:documentNumber" component={VerifyFromUrl} />
      <Route path="/proof-of-work" component={ProofOfWork} />
      <Route component={NotFound} />
    </Switch>
  );
}

function VerifyFromUrl() {
  return <VerifyDocument />;
}

function QrPublicLink() {
  return <VerifyDocument />;
}

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
};

function AppLayout() {
  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2 mr-auto">
              <img src="/images/customes-logo.png" alt="Logo" className="w-7 h-7" />
              <span className="text-sm font-semibold hidden sm:inline">الهيئة العامة للكمارك</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  const [isQrPublic] = useRoute("/qrpubliclink/:qrcode?");
  const [isQrPublicBase] = useRoute("/qrpubliclink");

  const isPublicRoute = isQrPublic || isQrPublicBase;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isPublicRoute ? (
          <Switch>
            <Route path="/qrpubliclink/:qrcode?" component={QrPublicLink} />
            <Route path="/qrpubliclink" component={QrPublicLink} />
          </Switch>
        ) : (
          <AppLayout />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
