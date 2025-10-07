
import { Sidebar } from "@/components/dashboard/sidebar";
import { TicketList } from "@/components/tickets/TicketList";
import { TicketForm } from "@/components/tickets/TicketForm";
import { LeadPilotLogo } from "@/components/ui/LeadPilotLogo";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentCampaigns } from "@/components/dashboard/recent-campaigns";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UploadModal } from "@/components/dashboard/upload-modal";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { NotificationDropdown } from "@/components/dashboard/notification-dropdown";
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";


export default function Dashboard() {
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { data: usageRaw } = useQuery<{ tier: string; current_usage: number; limit: number; remaining: number }>({
    queryKey: [`${apiUrl}/api/subscriptions/usage`],
  });
  const usage = usageRaw && typeof usageRaw === 'object' && 'tier' in usageRaw ? usageRaw : undefined;

  useEffect(() => {
    if (usage && usage.current_usage > usage.limit) {
      window.location.href = "/pricing";
    }
  }, [usage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Sidebar />
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
              <p className="text-slate-600">Here's what's happening with your Lead outreach today.</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notification Dropdown with Icon */}
              {user?.id && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <NotificationDropdown userId={user.id} />
                </div>
              )}
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-xl px-4 py-2 shadow-md">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase()} 
                  {user?.role?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-700" data-testid="text-user-email">
                    {user?.email}
                  </p>
                  <p className="text-xs text-slate-500" data-testid="text-user-role">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <StatsCards />

        {/* Usage Overview */}
        {usage && (
          <Card className="mb-8 card-enhanced border-0 shadow-lg animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <LeadPilotLogo size={24} />
                  </div>
                  <span className="text-lg font-semibold text-slate-800">Usage Overview</span>
                </div>
                <div className="px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
                  {usage.tier.toUpperCase()} Plan
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Progress Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Monthly Usage</span>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                      usage.current_usage > usage.limit 
                        ? 'bg-red-100 text-red-700' 
                        : usage.current_usage >= usage.limit * 0.8
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {usage.current_usage} / {usage.limit}
                      {usage.current_usage > usage.limit && <span className="ml-1">Over Limit!</span>}
                    </div>
                  </div>
                  
                  <div className="progress-enhanced">
                    <div
                      className={`progress-bar-enhanced ${
                        usage.current_usage > usage.limit
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : usage.current_usage >= usage.limit * 0.8
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, (usage.current_usage / usage.limit) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Alert Section */}
                {(usage.current_usage >= usage.limit * 0.8 || usage.current_usage > usage.limit) && (
                  <div className={`glass rounded-xl p-4 border ${
                    usage.current_usage > usage.limit 
                      ? 'border-red-200 bg-gradient-to-r from-red-50/80 to-red-100/50' 
                      : 'border-amber-200 bg-gradient-to-r from-amber-50/80 to-amber-100/50'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className={`font-semibold ${
                          usage.current_usage > usage.limit ? 'text-red-800' : 'text-amber-800'
                        }`}>
                          {usage.current_usage > usage.limit 
                            ? '⚠️ Usage Limit Exceeded' 
                            : usage.current_usage >= usage.limit 
                            ? '🔔 Limit Reached' 
                            : '📊 Approaching Limit'
                          }
                        </h4>
                        <p className={`text-sm ${
                          usage.current_usage > usage.limit ? 'text-red-700' : 'text-amber-700'
                        }`}>
                          {usage.current_usage > usage.limit
                            ? 'You have exceeded your monthly limit. Upgrade to continue.'
                            : `${usage.remaining} leads remaining this month`}
                        </p>
                      </div>
                      <Button
                        className="btn-primary-enhanced"
                        onClick={() => window.location.href = "/pricing"}
                      >
                        {usage.current_usage > usage.limit ? '🚀 Upgrade Now' : '📈 Upgrade Plan'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <RecentCampaigns />
          <div className="space-y-6">
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-2">Your Tickets</h2>
              <TicketForm />
              <div className="mt-4">
                <TicketList />
              </div>
            </div>
          </div>
        </div>

        <RecentActivity />
      </main>

      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />
    </div>
  );
}
