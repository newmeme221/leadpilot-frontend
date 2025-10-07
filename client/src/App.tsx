import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admindashboard";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketForm } from "@/components/tickets/TicketForm";
import AuthPage from "@/pages/auth-page";
import Leads from "@/pages/leads";
import Activity from "@/pages/activity";
import EmailCampaigns from "@/pages/emailCampaigns";
import Pricing from "@/pages/pricing";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/admin" component={Admin} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/leads" component={Leads} />
      <ProtectedRoute path="/email-campaigns" component={EmailCampaigns} />
      <ProtectedRoute path="/pricing" component={Pricing} />
      <ProtectedRoute path="/activity" component={Activity} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
