import { useCreateTicket } from "@/hooks/use-tickets";
import { useState } from "react";

export function TicketForm({ onSuccess }: { onSuccess?: () => void }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const { mutate, isPending, error } = useCreateTicket();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate(
      { subject, description },
      {
        onSuccess: () => {
          setSubject("");
          setDescription("");
          onSuccess?.();
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-xl shadow-md border border-slate-100 max-w-md mx-auto">
      <h2 className="text-lg font-bold text-blue-900 mb-2">Create a Ticket</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full border border-slate-300 rounded px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
        disabled={isPending}
      >
        {isPending ? "Creating..." : "Create Ticket"}
      </button>
      {error && <div className="text-red-500 mt-2">Error creating ticket</div>}
    </form>
  );
}
