import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX } from "lucide-react";

export function UserSummaryCards({ users }: { users: Array<any> }) {
  const total = users.length;
  const admins = users.filter(u => u.role === "admin").length;
  const active = users.filter(u => u.status === "active").length;

  const cards = [
    {
      title: "Total Users",
      value: total,
      icon: Users,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Admins",
      value: admins,
      icon: UserCheck,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      title: "Active Users",
      value: active,
      icon: UserX,
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="card-enhanced animate-fade-in">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-600">{card.title}</h3>
                <div className="text-2xl font-bold text-slate-800">{card.value}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
