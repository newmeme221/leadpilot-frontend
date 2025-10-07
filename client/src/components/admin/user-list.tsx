import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ShieldCheck, UserCheck } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

type UserType = {
  id: number;
  email: string;
  role: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  status?: string;
  last_login?: string | null;
};

export function UserList() {
  const { data: users, isLoading } = useQuery<UserType[]>({
    queryKey: ["users-list"],
    queryFn: async () => {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-full rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-12 w-full rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-12 w-full rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-12 w-full rounded-lg bg-gray-200 animate-pulse" />
      </div>
    );
  }

  // KPIs
  const totalUsers = users?.length || 0;
  const adminCount = users?.filter(u => u.role === "admin").length || 0;
  const activeCount = users?.filter(u => u.status === "active").length || 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card-enhanced group animate-fade-in hover:scale-105 transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full transform translate-x-6 -translate-y-6 opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-600 tracking-wide">Total Users</h3>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mb-3">
                <div className="text-3xl font-bold text-slate-800 mb-1">{totalUsers}</div>
                <span className="text-xs text-slate-500">All registered users</span>
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, Math.max(10, totalUsers))}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-enhanced group animate-fade-in hover:scale-105 transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full transform translate-x-6 -translate-y-6 opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-600 tracking-wide">Admins</h3>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mb-3">
                <div className="text-3xl font-bold text-slate-800 mb-1">{adminCount}</div>
                <span className="text-xs text-slate-500">Users with admin role</span>
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, Math.max(10, adminCount))}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-enhanced group animate-fade-in hover:scale-105 transition-all duration-300 cursor-pointer">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full transform translate-x-6 -translate-y-6 opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-600 tracking-wide">Active Users</h3>
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="mb-3">
                <div className="text-3xl font-bold text-slate-800 mb-1">{activeCount}</div>
                <span className="text-xs text-slate-500">Users currently active</span>
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, Math.max(10, activeCount))}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-600 border-b">
              <th className="py-2 text-left">Email</th>
              <th className="py-2 text-left">Role</th>
              <th className="py-2 text-left">Status</th>
              <th className="py-2 text-left">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users?.map(user => (
              <tr key={user.id} className="border-b last:border-none">
                <td className="py-2">{user.email}</td>
                <td className="py-2">{user.role}</td>
                <td className="py-2">{user.status || <span className="text-muted-foreground">-</span>}</td>
                <td className="py-2">{user.last_login ? new Date(user.last_login).toLocaleString() : <span className="text-muted-foreground">-</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </>
  );
}
