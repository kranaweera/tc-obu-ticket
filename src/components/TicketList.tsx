"use client";

import { useState, useEffect, useCallback } from "react";
import type { Ticket, TicketStatus } from "@/lib/types";

const STATUS_STYLES: Record<TicketStatus, string> = {
  valid: "bg-green-100 text-green-800",
  used: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

interface EditState {
  name: string;
  status: TicketStatus;
  paymentReference: string;
  notes: string;
}

const INPUT_CLS =
  "w-full px-2 py-1 border border-blue-300 rounded text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function TicketList({ refreshKey }: { refreshKey: number }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: "", status: "valid", paymentReference: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets", { headers: { "Content-Type": "application/json" } });
      if (res.ok) setTickets(await res.json());
    } catch {
      // auth not ready yet — silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets, refreshKey]);

  function startEdit(ticket: Ticket) {
    setEditingId(ticket.id);
    setEditState({
      name: ticket.name,
      status: ticket.status,
      paymentReference: ticket.paymentReference,
      notes: ticket.notes ?? "",
    });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editState.name.trim(),
          status: editState.status,
          paymentReference: editState.paymentReference.trim(),
          notes: editState.notes.trim() || undefined,
        }),
      });
      if (res.ok) {
        const updated: Ticket = await res.json();
        setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) setTickets((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  async function downloadTicket(ticket: Ticket) {
    setDownloadingId(ticket.id);
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticket.id)}/download`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${ticket.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  }

  const filtered = tickets.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.paymentReference.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    total: tickets.length,
    valid: tickets.filter((t) => t.status === "valid").length,
    used: tickets.filter((t) => t.status === "used").length,
    cancelled: tickets.filter((t) => t.status === "cancelled").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.total, color: "text-gray-900" },
          { label: "Valid", value: counts.valid, color: "text-green-700" },
          { label: "Used", value: counts.used, color: "text-gray-500" },
          { label: "Cancelled", value: counts.cancelled, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + refresh */}
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ticket number or payment ref…"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
        />
        <button
          onClick={fetchTickets}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          title="Refresh"
        >
          <RefreshIcon />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-sm text-gray-400 gap-2">
            <SpinnerIcon /> Loading tickets…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            {search ? "No tickets match your search." : "No tickets generated yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 whitespace-nowrap">Ticket #</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Payment Ref</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3 whitespace-nowrap">Created By</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((ticket) => {
                  const isEditing = editingId === ticket.id;
                  const isDeleting = deletingId === ticket.id;
                  const confirmingDelete = confirmDeleteId === ticket.id;
                  const isDownloading = downloadingId === ticket.id;

                  return (
                    <tr
                      key={ticket.id}
                      className={`${isEditing ? "bg-blue-50" : "hover:bg-gray-50"} transition-colors`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {ticket.id}
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-900 min-w-32">
                        {isEditing ? (
                          <input
                            value={editState.name}
                            onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                            className={INPUT_CLS}
                            autoFocus
                          />
                        ) : ticket.name}
                      </td>

                      <td className="px-4 py-3 min-w-32">
                        {isEditing ? (
                          <input
                            value={editState.paymentReference}
                            onChange={(e) => setEditState((s) => ({ ...s, paymentReference: e.target.value }))}
                            className={INPUT_CLS}
                          />
                        ) : (
                          <span className="text-xs font-mono text-gray-600">{ticket.paymentReference}</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editState.status}
                            onChange={(e) =>
                              setEditState((s) => ({ ...s, status: e.target.value as TicketStatus }))
                            }
                            className="px-2 py-1 border border-blue-300 rounded text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="valid">Valid</option>
                            <option value="used">Used</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[ticket.status]}`}>
                            {ticket.status}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(ticket.issuedAt).toLocaleDateString(undefined, {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                        <br />
                        <span className="text-gray-400">
                          {new Date(ticket.issuedAt).toLocaleTimeString(undefined, {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500 max-w-36 truncate" title={ticket.createdBy}>
                        {ticket.createdBy}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500 min-w-24">
                        {isEditing ? (
                          <input
                            value={editState.notes}
                            onChange={(e) => setEditState((s) => ({ ...s, notes: e.target.value }))}
                            placeholder="Optional note…"
                            className={INPUT_CLS}
                          />
                        ) : (
                          <span className="text-gray-400 italic">{ticket.notes ?? "—"}</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => saveEdit(ticket.id)}
                              disabled={saving || !editState.name.trim()}
                              className="px-3 py-1 bg-gray-900 text-white rounded text-xs font-medium hover:bg-gray-700 disabled:opacity-50"
                            >
                              {saving ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              disabled={saving}
                              className="px-3 py-1 border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : confirmingDelete ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-red-600 font-medium">Delete?</span>
                            <button
                              onClick={() => confirmDelete(ticket.id)}
                              disabled={isDeleting}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                              {isDeleting ? "…" : "Yes"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1 border border-gray-300 text-gray-600 rounded text-xs hover:bg-gray-50"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => downloadTicket(ticket)}
                              disabled={isDownloading}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
                              title="Re-download PDF"
                            >
                              {isDownloading ? <SpinnerIcon /> : <DownloadIcon />}
                            </button>
                            <button
                              onClick={() => startEdit(ticket)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                              title="Edit"
                            >
                              <PencilIcon />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(ticket.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
