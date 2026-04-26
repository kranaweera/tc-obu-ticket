"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import TicketGenerator from "./TicketGenerator";
import TicketScanner from "./TicketScanner";
import TicketList from "./TicketList";

type Tab = "generate" | "scan" | "tickets";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "generate",
    label: "Generate",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" />
      </svg>
    ),
  },
  {
    id: "scan",
    label: "Scan",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 010 2H5v2a1 1 0 01-2 0V4zm9-1a1 1 0 110 2h-1v2a1 1 0 11-2 0V4a1 1 0 011-1h2zm-9 9a1 1 0 112 0v2h2a1 1 0 110 2H4a1 1 0 01-1-1v-3zm12 3a1 1 0 11-2 0v-2h-2a1 1 0 110-2h3a1 1 0 011 1v3zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: "tickets",
    label: "Tickets",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
      </svg>
    ),
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("generate");
  const [ticketListKey, setTicketListKey] = useState(0);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) router.replace("/login");
    });
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="w-6 h-6 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-900">Ticket Portal</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-4xl mx-auto flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "generate" && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Generate Ticket</h2>
            <p className="text-sm text-gray-500 mb-6">Create and download a PDF ticket for an attendee.</p>
            <div className="max-w-lg">
              <TicketGenerator onGenerated={() => setTicketListKey((k) => k + 1)} />
            </div>
          </section>
        )}

        {activeTab === "scan" && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Scan &amp; Check In</h2>
            <p className="text-sm text-gray-500 mb-6">
              Validate tickets at the door. Use a USB barcode scanner or the device camera.
            </p>
            <div className="max-w-lg">
              <TicketScanner />
            </div>
          </section>
        )}

        {activeTab === "tickets" && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Issued Tickets</h2>
            <p className="text-sm text-gray-500 mb-6">
              View, edit, or delete tickets. Click the pencil to edit inline.
            </p>
            <TicketList refreshKey={ticketListKey} />
          </section>
        )}
      </div>
    </div>
  );
}
