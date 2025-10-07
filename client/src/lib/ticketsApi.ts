const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getTickets() {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${apiUrl}/api/tickets`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json();
}

export async function getTicketById(id: string | number) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${apiUrl}/api/tickets/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch ticket");
  return res.json();
}

export async function createTicket(data: any) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${apiUrl}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create ticket");
  return res.json();
}

export async function updateTicket(id: string | number, data: any) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${apiUrl}/api/tickets/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update ticket");
  return res.json();
}

export async function deleteTicket(id: string | number) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${apiUrl}/api/tickets/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to delete ticket");
  return res.json();
}

// Add comment to ticket
export async function addComment(ticketId: string | number, content: string) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${apiUrl}/api/tickets/${ticketId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to add comment");
  return res.json();
}
