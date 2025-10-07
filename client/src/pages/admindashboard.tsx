import { AdSidebar } from "@/components/admin/adminsidebar";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketDetails } from "@/components/tickets/TicketDetails";
import { TicketForm } from "@/components/tickets/TicketForm";
import { LeadPilotLogo } from "@/components/ui/LeadPilotLogo";
import { StatsCards } from "@/components/admin/stats-cards";
import { RecentCampaigns } from "@/components/admin/recent-campaigns";
import { QuickActions } from "@/components/admin/quick-actions";
import { RecentActivity } from "@/components/admin/recent-activity";
import { UserList } from "@/components/admin/user-list";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { NotificationDropdown } from "@/components/admin/notification-dropdown";
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";


export default function AdDashboard() {
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { data: usageRaw } = useQuery<{ tier: string; current_usage: number; limit: number; remaining: number }>({
    queryKey: ["usage-widget"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/api/subscriptions/usage`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch usage");
      return await res.json();
    },
    refetchInterval: 10000, // auto-refresh every 10s for real-time updates
  });
  const usage = usageRaw && typeof usageRaw === 'object' && 'tier' in usageRaw ? usageRaw : undefined;

  const [selectedTicketId, setSelectedTicketId] = useState<string | number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <AdSidebar /> 
      <main className="main-content ml-0 xl:ml-72 p-4 xl:p-8 min-h-screen animate-fade-in transition-all duration-300">
        {/* Header */}
        <header className="mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-800">Welcome back!</h1>
                <div className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-medium rounded-full shadow-md">
                  Online
                </div>
              </div>
              <p className="text-slate-600">Here's what's happening with Users today.</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Notification Dropdown */}
              {user?.id && <NotificationDropdown userId={user.id} />}
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-2 shadow-md">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-700" data-testid="text-user-email">
                    {user?.email}
                  </p>
                  <p className="text-xs text-slate-500" data-testid="text-user-role">
                    {user?.role}
                  </p>
                </div>
               </div>
              
            </div>
          </div>
        </header>
        {/* Admin Dashboard Tabs */}
        <Tabs defaultValue="users" >
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <Card className="mb-8 card-enhanced border-0 shadow-lg animate-slide-up">
              <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
              <UserList />
            </Card>
          </TabsContent>
          <TabsContent value="tickets">
            <Card className="mb-8 card-enhanced border-0 shadow-lg animate-slide-up">
              <CardHeader><CardTitle>Ticket Management</CardTitle></CardHeader>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <TicketList onSelect={setSelectedTicketId} />
                </div>
                <div>
                  {selectedTicketId ? (
                    <TicketDetails id={selectedTicketId} />
                  ) : (
                    <div className="p-6 text-slate-500 text-center">Select a ticket to view details and resolve.</div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
