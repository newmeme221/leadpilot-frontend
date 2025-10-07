import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Users, Send, Reply, Handshake } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function StatsCards() {
  const { data: stats, isLoading } = useQuery<{sent: number, accepted: number, replied: number, failed: number}>({
    queryKey: [`${apiUrl}/api/campaigns/stats`],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/api/campaigns/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return await res.json();
    },
    refetchInterval: 10000,
  });

  const totalLeads = (stats?.sent || 0) + (stats?.accepted || 0) + (stats?.replied || 0) + (stats?.failed || 0);
  const responseRate = totalLeads > 0 ? ((stats?.replied || 0) / totalLeads * 100).toFixed(1) : "0.0";

  const cards = [
    {
      title: "Total Leads",
      value: totalLeads,
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      changeType: "increase" as const,
      testId: "card-total-leads"
    },
    {
      title: "Messages Sent",
      value: stats?.sent || 0,
      icon: Send,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100",
      changeType: "increase" as const,
      testId: "card-messages-sent"
    },
    {
      title: "Response Rate",
      value: `${responseRate}%`,
      icon: Reply,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100",
      changeType: "increase" as const,
      testId: "card-response-rate"
    },
    {
      title: "Connections",
      value: stats?.accepted || 0,
      icon: Handshake,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100",
      changeType: "increase" as const,
      testId: "card-connections"
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="card-enhanced animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-16 mb-3" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Debug: Show raw stats response for troubleshooting */}
      <pre style={{background: '#f8fafc', color: '#334155', padding: '8px', borderRadius: '8px', marginBottom: '12px', fontSize: '12px'}}>
      </pre>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.title} 
              data-testid={card.testId}
              className="card-enhanced group animate-fade-in hover:scale-105 transition-all duration-300 cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 relative overflow-hidden">
                {/* Background decoration */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.bgGradient} rounded-full transform translate-x-6 -translate-y-6 opacity-50 group-hover:scale-110 transition-transform duration-300`}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-600 tracking-wide" data-testid={`text-${card.testId}-title`}>
                      {card.title}
                    </h3>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-3xl font-bold text-slate-800 mb-1" data-testid={`text-${card.testId}-value`}>
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </div>
                    <div className="flex items-center gap-2" data-testid={`text-${card.testId}-change`}>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        card.changeType === 'increase' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {card.changeType === 'increase' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}

                   
                      </div>
                      <span className="text-xs text-slate-500">This month</span>
                    </div>
                  </div>
                  {/* Progress indicator */}
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${card.gradient} rounded-full transition-all duration-1000 ease-out`}
                      style={{ 
                        width: `${Math.min(100, Math.max(10, (typeof card.value === 'number' ? card.value : parseInt(card.value)) / 10))}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );

}
