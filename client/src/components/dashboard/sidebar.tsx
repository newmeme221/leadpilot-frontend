
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { LeadPilotLogo } from "@/components/ui/LeadPilotLogo";
import { NotificationDropdown } from "@/components/dashboard/notification-dropdown";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  Mail, 
  CreditCard, 
  History,
  Crown,
  AlertCircle,
  CheckCircle,
  Settings
} from "lucide-react"; 
import { useEffect } from "react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);
  // ...existing code...
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    // window.location.reload(); // force user state update
    navigate("/auth");
  };
  
  const { data: usage } = useQuery<{tier: string, current_usage: number, limit: number, remaining: number}>({
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

  const navItems = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/leads", label: "Leads", icon: Users },
    { href: "/email-campaigns", label: "Email Campaigns", icon: Mail },
    { href: "/activity", label: "Activity Logs", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const usagePercentage = usage ? Math.min(100, (usage.current_usage / usage.limit) * 100) : 0;
  const isOverLimit = usage && usage.current_usage > usage.limit;
  const isNearLimit = usage && usage.current_usage >= usage.limit * 0.8;

  return (
    <aside
      className="sidebar glass min-h-screen w-72 fixed left-0 top-0 z-20 p-6 border-r-2 border-white/20 xl:translate-x-0"
      style={{
        background: `linear-gradient(135deg, 
          hsla(210, 100%, 98%, 0.95) 0%, 
          hsla(220, 100%, 96%, 0.9) 50%,
          hsla(230, 100%, 94%, 0.85) 100%)`,
      }}
      data-testid="sidebar"
    >
      {/* Logo Section + Notification Center */}
      <div className="flex items-center gap-3 mb-12 p-2 relative">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <LeadPilotLogo size={32} />
        </div>
        <div>
          <h1 className="font-bold text-xl text-slate-800">LeadPilot</h1>
          <p className="text-xs text-slate-500">Lead Mgt & Outreach Tool</p>
        </div>
        {/* Persistent Notification Center */}
      </div>

      {/* Navigation */}
      <nav className="space-y-2 mb-8">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "nav-item-enhanced group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 no-underline",
                isActive
                  ? "bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700 shadow-md active"
                  : "text-slate-600 hover:text-blue-700 hover:bg-white/50"
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn(
                "p-2.5 rounded-lg transition-all duration-200 flex-shrink-0",
                isActive
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"
                  : "bg-slate-100 group-hover:bg-white group-hover:shadow-md"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  isActive ? "text-white" : "text-slate-600 group-hover:text-blue-600"
                )} />
              </div>
              <span className="font-medium text-sm tracking-wide flex-1">{item.label}</span>
              {isActive && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </Link>
          );
        })}
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="nav-item-enhanced group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 no-underline text-slate-600 hover:text-red-700 hover:bg-red-50 mt-4"
          data-testid="nav-logout"
        >
          <span className="p-2.5 rounded-lg bg-slate-100 group-hover:bg-red-100 group-hover:shadow-md flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 group-hover:text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
          </span>
          <span className="font-medium text-sm tracking-wide flex-1">Logout</span>
        </button>
      </nav>

      {/* Usage Widget - always visible, auto-updating */}
      <div 
        className="mt-auto p-5 rounded-2xl glass border border-white/30 animate-fade-in"
        style={{
          background: `linear-gradient(135deg, 
            hsla(0, 0%, 100%, 0.8) 0%, 
            hsla(220, 100%, 98%, 0.6) 100%)`,
        }}
        data-testid="usage-widget"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold capitalize text-slate-700" data-testid="text-plan-name">
              {usage ? usage.tier : "-"} Plan
            </span>
          </div>
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1",
            usage ? (
              isOverLimit 
                ? "bg-red-100 text-red-700" 
                : isNearLimit 
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            ) : "bg-gray-100 text-gray-400"
          )} data-testid="text-usage-current">
            {usage ? (
              isOverLimit ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )
            ) : null}
            {usage ? `${usage.current_usage}/${usage.limit}` : "-/-"}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-enhanced mb-3">
          <div 
            className={cn(
              "progress-bar-enhanced",
              usage ? (
                isOverLimit 
                  ? "bg-gradient-to-r from-red-500 to-red-600" 
                  : isNearLimit
                  ? "bg-gradient-to-r from-amber-500 to-amber-600"
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              ) : "bg-gray-300"
            )}
            style={{ width: usage ? `${usagePercentage}%` : "0%" }}
            data-testid="progress-usage"
          ></div>
        </div>

        {/* Status Text */}
        <div className="space-y-2">
          <p className={cn(
            "text-xs font-medium flex items-center gap-2",
            usage ? (
              isOverLimit 
                ? "text-red-700" 
                : isNearLimit 
                ? "text-amber-700"
                : "text-slate-600"
            ) : "text-gray-400"
          )} data-testid="text-remaining-leads">
            {usage ? (
              isOverLimit ? (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Over limit by {usage.current_usage - usage.limit}!
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3" />
                  {usage.remaining} leads remaining
                </>
              )
            ) : "Loading usage..."}
          </p>
          {usage && isNearLimit && (
            <button className="w-full py-2 px-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5" onClick={() => window.location.href = "/pricing"}>
              Upgrade Plan
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}