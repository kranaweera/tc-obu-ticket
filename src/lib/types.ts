export type TicketStatus = "valid" | "used" | "cancelled";

export interface Ticket {
  id: string;
  name: string;
  issuedAt: string;
  status: TicketStatus;
  scannedAt?: string;
  notes?: string;
}
