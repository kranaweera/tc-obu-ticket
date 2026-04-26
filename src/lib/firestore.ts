import { adminDb } from "./firebase-admin";
import type { Ticket } from "./types";

const COL = "tickets";

export async function saveTicket(ticket: Ticket): Promise<void> {
  await adminDb().collection(COL).doc(ticket.id).set(ticket);
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const doc = await adminDb().collection(COL).doc(id).get();
  return doc.exists ? (doc.data() as Ticket) : null;
}

export async function getAllTickets(): Promise<Ticket[]> {
  const snap = await adminDb()
    .collection(COL)
    .orderBy("issuedAt", "desc")
    .get();
  return snap.docs.map((d) => d.data() as Ticket);
}

export async function updateTicket(
  id: string,
  updates: Partial<Omit<Ticket, "id" | "issuedAt">>
): Promise<Ticket | null> {
  const ref = adminDb().collection(COL).doc(id);
  if (!(await ref.get()).exists) return null;
  await ref.update(updates as Record<string, unknown>);
  return (await ref.get()).data() as Ticket;
}

export async function deleteTicket(id: string): Promise<boolean> {
  const ref = adminDb().collection(COL).doc(id);
  if (!(await ref.get()).exists) return false;
  await ref.delete();
  return true;
}
