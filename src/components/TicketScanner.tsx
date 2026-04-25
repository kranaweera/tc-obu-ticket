"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  FormEvent,
  KeyboardEvent,
} from "react";
import type { Ticket } from "@/lib/types";

type ScanResult =
  | { valid: true; ticket: Ticket }
  | { valid: false; reason: string; ticket?: Ticket };

type CameraState = "idle" | "requesting" | "active" | "unsupported" | "error";

export default function TicketScanner() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [cameraError, setCameraError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function lookupTicket(id: string): Promise<void> {
    const cleaned = id.trim().toUpperCase();
    if (!cleaned) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(cleaned)}/scan`, {
        method: "POST",
      });
      const data = await res.json();
      setScanResult(data);
    } catch {
      setScanResult({ valid: false, reason: "Network error" });
    } finally {
      setScanning(false);
      setInputValue("");
      inputRef.current?.focus();
    }
  }

  function handleManualSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    lookupTicket(inputValue);
  }

  // Treat rapid-fire keyboard input (USB scanner) same as form submit
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupTicket(inputValue);
    }
  }

  // ── Camera scanning ──────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraState("idle");
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    detector
      .detect(video)
      .then((barcodes) => {
        if (barcodes.length > 0) {
          const raw = barcodes[0].rawValue;
          stopCamera();
          lookupTicket(raw);
        } else {
          rafRef.current = requestAnimationFrame(scanFrame);
        }
      })
      .catch(() => {
        rafRef.current = requestAnimationFrame(scanFrame);
      });
  }, [stopCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  async function startCamera() {
    if (!("BarcodeDetector" in window)) {
      setCameraState("unsupported");
      return;
    }
    setCameraState("requesting");
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      detectorRef.current = new BarcodeDetector({ formats: ["code_128", "qr_code"] });
      setCameraState("active");
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : "Camera unavailable");
      setCameraState("error");
    }
  }

  // Clean up camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="space-y-5">
      {/* Manual / USB scanner input */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500 mb-3">
          Point a USB barcode scanner at the ticket or type the ticket number below.
          The scanner will auto-submit on Enter.
        </p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="TCK-…"
            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
            disabled={scanning}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={scanning || !inputValue.trim()}
            className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {scanning ? <><SpinnerIcon />Checking…</> : "Check In"}
          </button>
        </form>
      </div>

      {/* Camera scanner */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Camera scanner</p>
          {cameraState === "active" ? (
            <button
              onClick={stopCamera}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Stop camera
            </button>
          ) : (
            <button
              onClick={startCamera}
              disabled={cameraState === "requesting"}
              className="text-xs text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
            >
              {cameraState === "requesting" ? "Requesting…" : "Open camera"}
            </button>
          )}
        </div>

        {cameraState === "active" && (
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-24 border-2 border-white/70 rounded-md" />
            </div>
            <p className="absolute bottom-2 left-0 right-0 text-center text-white/70 text-xs">
              Align barcode within the box
            </p>
          </div>
        )}

        {cameraState === "unsupported" && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Camera barcode detection not supported in this browser. Use the USB scanner input above or try Chrome / Edge.
          </p>
        )}

        {cameraState === "error" && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {cameraError}
          </p>
        )}

        {cameraState === "idle" && (
          <p className="text-xs text-gray-400">
            Uses your device camera to scan the ticket barcode. Works in Chrome &amp; Edge.
          </p>
        )}
      </div>

      {/* Scan result */}
      {scanResult && <ScanResultCard result={scanResult} onDismiss={() => setScanResult(null)} />}
    </div>
  );
}

function ScanResultCard({
  result,
  onDismiss,
}: {
  result: ScanResult;
  onDismiss: () => void;
}) {
  if (result.valid) {
    return (
      <div className="bg-green-50 border-2 border-green-400 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <CheckIcon className="text-white" />
            </div>
            <div>
              <p className="font-bold text-green-900 text-lg">{result.ticket.name}</p>
              <p className="text-sm text-green-700 font-mono">{result.ticket.id}</p>
              <p className="text-xs text-green-600 mt-1">Checked in successfully</p>
            </div>
          </div>
          <button onClick={onDismiss} className="text-green-600 hover:text-green-800">
            <XIcon />
          </button>
        </div>
      </div>
    );
  }

  const isAlreadyUsed = result.reason === "Already scanned";
  const bgClass = isAlreadyUsed ? "bg-amber-50 border-amber-400" : "bg-red-50 border-red-400";
  const textClass = isAlreadyUsed ? "text-amber-900" : "text-red-900";
  const subTextClass = isAlreadyUsed ? "text-amber-700" : "text-red-700";
  const iconBg = isAlreadyUsed ? "bg-amber-400" : "bg-red-500";

  return (
    <div className={`border-2 rounded-xl p-5 ${bgClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center shrink-0`}>
            <XIcon className="text-white" />
          </div>
          <div>
            <p className={`font-bold text-lg ${textClass}`}>{result.reason}</p>
            {result.ticket && (
              <>
                <p className={`text-sm font-medium ${subTextClass}`}>{result.ticket.name}</p>
                <p className={`text-xs font-mono ${subTextClass}`}>{result.ticket.id}</p>
                {result.ticket.scannedAt && (
                  <p className={`text-xs mt-1 ${subTextClass}`}>
                    Scanned at {new Date(result.ticket.scannedAt).toLocaleTimeString()}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <button onClick={onDismiss} className={subTextClass}>
          <XIcon />
        </button>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className ?? ""}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className ?? ""}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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
