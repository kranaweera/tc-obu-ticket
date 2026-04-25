// File-based ticket store — works locally and on Vercel (within a warm function instance).
// For production with multiple Vercel instances, replace read/write with Vercel KV:
//   import { kv } from "@vercel/kv";
//   and swap readStore/writeStore to kv.hgetall / kv.hset calls.
import fs from "fs/promises";
import type { Ticket } from "./types";

const STORE_PATH = "/tmp/tickets.json";

async function readStore(): Promise<Record<string, Ticket>> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, Ticket>;
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, Ticket>): Promise<void> {
  await fs.writeFile(STORE_PATH, JSON.stringify(store));
}

export async function saveTicket(ticket: Ticket): Promise<void> {
  const store = await readStore();
  store[ticket.id] = ticket;
  await writeStore(store);
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const store = await readStore();
  return store[id] ?? null;
}

export async function getAllTickets(): Promise<Ticket[]> {
  const store = await readStore();
  return Object.values(store).sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
  );
}

export async function updateTicket(
  id: string,
  updates: Partial<Omit<Ticket, "id" | "issuedAt">>
): Promise<Ticket | null> {
  const store = await readStore();
  if (!store[id]) return null;
  store[id] = { ...store[id], ...updates };
  await writeStore(store);
  return store[id];
}

export async function deleteTicket(id: string): Promise<boolean> {
  const store = await readStore();
  if (!store[id]) return false;
  delete store[id];
  await writeStore(store);
  return true;
}
