export type TicketStatus = "valid" | "used" | "cancelled";

export interface Ticket {
  id: string;
  name: string;
  paymentReference: string;
  issuedAt: string;
  status: TicketStatus;
  createdBy: string;    // Firebase user email
  scannedAt?: string;
  notes?: string;
}
