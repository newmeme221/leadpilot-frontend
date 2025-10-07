import { useTickets } from "@/hooks/use-tickets";

export function TicketList({ onSelect }: { onSelect?: (id: string | number) => void }) {
  const { data: tickets, isLoading, error } = useTickets();

  if (isLoading) return <div>Loading tickets...</div>;
  if (error) return <div className="text-red-500">Error loading tickets</div>;
  if (!tickets || tickets.length === 0) return <div>No tickets found.</div>;

  return (
    <div className="space-y-2">
      {tickets.map((ticket: any) => (
        <div
          key={ticket.id}
          className="p-4 bg-white rounded-xl shadow-md border border-slate-100 hover:shadow-lg hover:border-blue-300 transition cursor-pointer group"
          onClick={() => onSelect?.(ticket.id)}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-lg text-blue-900 group-hover:text-blue-700">{ticket.title}</div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              ticket.status === "open"
                ? "bg-emerald-100 text-emerald-700"
                : ticket.status === "closed"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {ticket.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Priority: <span className="font-medium">{ticket.priority || "Normal"}</span></span>
            <span>Created: {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "-"}</span>
          </div>
          <div className="text-sm text-slate-700 line-clamp-2">{ticket.description}</div>
        </div>
      ))}
    </div>
  );
}
