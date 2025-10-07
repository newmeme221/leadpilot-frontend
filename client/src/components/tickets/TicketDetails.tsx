import { useState } from "react";
import {
  useTicket,
  useUpdateTicket,
  useDeleteTicket,
  useAddComment,
} from "@/hooks/use-tickets";
import { Button } from "@/components/ui/button";

type TicketStatus = "open" | "closed" | "pending";

function StatusBadge({ status }: { status: TicketStatus }) {
  const styles = {
    open: "bg-emerald-100 text-emerald-700",
    closed: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
  }[status] || "bg-gray-100 text-gray-700";

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-bold ${styles}`}
    >
      {status}
    </span>
  );
}

export function TicketDetails({ id }: { id: string | number }) {
  const { data: ticket, isLoading, error } = useTicket(id);
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();
  const addComment = useAddComment();

  const [comment, setComment] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);

  if (isLoading) return <div>Loading ticket...</div>;
  if (error) return <div className="text-red-500">Error loading ticket</div>;
  if (!ticket) return <div>Ticket not found.</div>;

  const handleStatusChange = (status: TicketStatus) => {
    updateTicket.mutate({ id, update: { status } });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      deleteTicket.mutate(id);
    }
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      addComment.mutate({ ticketId: id, content: comment });
      setComment("");
      setShowCommentForm(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-xl text-blue-900">{ticket.title}</div>
        <StatusBadge status={ticket.status as TicketStatus} />
      </div>

      {/* Meta Info */}
      <div className="mb-2 text-xs text-slate-500 flex gap-4 items-center flex-wrap">
        <span>
          Priority:{" "}
          <span className="font-medium">{ticket.priority || "Normal"}</span>
        </span>
        <span>
          Created:{" "}
          {ticket.created_at
            ? new Date(ticket.created_at).toLocaleString()
            : "-"}
        </span>
        <span>
          By: <span className="font-medium">{ticket.user?.email }</span>
        </span>
        {ticket.user?.email && (
          <a
            href={`mailto:${ticket.user.email}`}
            className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition"
            title={`Email ${ticket.user.email}`}
          >
            Contact User
          </a>
        )}
      </div>

      {/* Description */}
      <div className="mb-2 text-slate-700 text-sm whitespace-pre-line">
        {ticket.description}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          disabled={(updateTicket.isPending ?? (updateTicket as any).isMutating ?? false)}
          onClick={() => handleStatusChange("open")}
        >
          Open
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={(updateTicket.isPending ?? (updateTicket as any).isMutating ?? false)}
          onClick={() => handleStatusChange("closed")}
        >
          Close
        </Button>
        <Button
          size="sm"
          variant="default"
          disabled={(updateTicket.isPending ?? (updateTicket as any).isMutating ?? false)}
          onClick={() => handleStatusChange("pending")}
        >
          Update
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={(deleteTicket.isPending ?? (deleteTicket as any).isMutating ?? false)}
          onClick={handleDelete}
        >
          Delete
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowCommentForm((v) => !v)}
        >
          {showCommentForm ? "Cancel" : "Add Comment"}
        </Button>
      </div>

      {/* Feedback for mutations */}
      {updateTicket.isError && (
        <div className="text-red-500 text-sm mt-2">
          Failed to update ticket.
        </div>
      )}
      {addComment.isError && (
        <div className="text-red-500 text-sm mt-2">
          Failed to add comment.
        </div>
      )}

      {/* Comment Form */}
      {showCommentForm && (
        <div className="mt-4 flex gap-2 items-center">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            className="border rounded px-3 py-2 w-2/3"
            placeholder="Enter your comment..."
          />
          <Button
            size="sm"
            variant="default"
            disabled={(addComment.isPending ?? (addComment as any).isMutating ?? false)}
            onClick={handleAddComment}
          >
            Submit
          </Button>
        </div>
      )}

      {/* Existing Comments */}
      {ticket.comments && ticket.comments.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-slate-800 mb-2 text-sm">
            Comments
          </h3>
          <ul className="space-y-2">
            {ticket.comments.map((c: any) => (
              <li
                key={c.id}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{c.author}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <div>{c.content}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
