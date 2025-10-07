import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTickets, getTicketById, createTicket, updateTicket, deleteTicket, addComment } from "@/lib/ticketsApi";

export function useTickets() {
  return useQuery({
    queryKey: ["tickets"],
    queryFn: getTickets,
  });
}

export function useTicket(id: string | number) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicketById(id),
    enabled: !!id,
  });
}


export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}


export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, update }: { id: string | number; update: any }) => updateTicket(id, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}
// Add comment mutation hook
export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: string | number; content: string }) => addComment(ticketId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}


export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}
