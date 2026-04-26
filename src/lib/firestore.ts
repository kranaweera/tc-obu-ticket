// Storage backed by Upstash Redis (free tier: 10k req/day, no expiry).
// Drop-in replacement for Firestore — API routes import this unchanged.
// Setup: create a Redis DB at upstash.com, copy the REST URL and token to env vars.
import { Redis } from "@upstash/redis";
import type { Ticket } from "./types";

const redis = Redis.fromEnv();
// Requires: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

const KEY = (id: string) => `ticket:${id}`;
const INDEX = "tickets"; // sorted set — score = issuedAt timestamp

export async function saveTicket(ticket: Ticket): Promise<void> {
  await Promise.all([
    redis.set(KEY(ticket.id), ticket),
    redis.zadd(INDEX, { score: new Date(ticket.issuedAt).getTime(), member: ticket.id }),
  ]);
}

export async function getTicket(id: string): Promise<Ticket | null> {
  return redis.get<Ticket>(KEY(id));
}

export async function getAllTickets(): Promise<Ticket[]> {
  const ids = await redis.zrange(INDEX, 0, -1, { rev: true });
  if (!ids.length) return [];
  const tickets = await Promise.all((ids as string[]).map((id) => redis.get<Ticket>(KEY(id))));
  return tickets.filter((t): t is Ticket => t !== null);
}

export async function updateTicket(
  id: string,
  updates: Partial<Omit<Ticket, "id" | "issuedAt">>
): Promise<Ticket | null> {
  const existing = await redis.get<Ticket>(KEY(id));
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  await redis.set(KEY(id), updated);
  return updated;
}

export async function deleteTicket(id: string): Promise<boolean> {
  const exists = await redis.exists(KEY(id));
  if (!exists) return false;
  await Promise.all([redis.del(KEY(id)), redis.zrem(INDEX, id)]);
  return true;
}
