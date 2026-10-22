"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const STATUS_MSG: Record<string, string> = {
  requested: "Waiting for the owner to accept your request…",
  completed: "This ride is complete. ✅",
  cancelled: "This booking was cancelled.",
};

export default function ManageBooking() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.bookings.get(Number(id)).then(setBooking).catch(() => router.push("/dashboard"));
  }, [id]);

  async function submitOtp() {
    if (code.length !== 6) { setMsg("Enter the 6-digit OTP"); return; }
    setMsg(""); setLoading(true);
    const isAccepted = booking.status === "accepted";
    try {
      if (isAccepted) {
        const data = await api.bookings.start(Number(id), code);
        setMsg(`✅ Ride started! End OTP: ${data.end_otp} — show this to the owner when done.`);
        setBooking((b: any) => ({ ...b, status: "active" }));
      } else {
        await api.bookings.complete(Number(id), code);
        setMsg("✅ Ride complete!");
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } catch (err: any) { setMsg("❌ " + (err.message ?? "Wrong OTP")); }
    finally { setLoading(false); setCode(""); }
  }

  if (!booking) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  const isAccepted = booking.status === "accepted";
  const isActive   = booking.status === "active";
  const needsOtp   = isAccepted || isActive;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← Dashboard</Link>
        <h1 className="text-xl font-bold mt-4 mb-1">{booking.cycle_title}</h1>
        <p className="text-gray-500 text-sm mb-4">{booking.hostel}</p>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          isActive ? "bg-green-100 text-green-700" :
          isAccepted ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
        }`}>{booking.status}</span>

        {needsOtp && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">
              {isAccepted
                ? "Enter the start OTP from the owner to begin your ride."
                : "Enter the end OTP from the owner to complete your ride."}
            </p>
            <input
              type="text" inputMode="numeric" maxLength={6} value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full border border-gray-300 rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            {msg && <p className="text-sm mb-3 break-words">{msg}</p>}
            <button onClick={submitOtp} disabled={loading || code.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition">
              {loading ? "Verifying…" : isAccepted ? "Start Ride" : "Complete Ride"}
            </button>
            {isAccepted && (
              <button onClick={() => api.bookings.cancel(Number(id)).then(() => router.push("/dashboard"))}
                className="w-full mt-3 text-sm text-red-500 hover:underline">
                Cancel booking
              </button>
            )}
          </div>
        )}

        {!needsOtp && (
          <p className="mt-6 text-sm text-gray-500">{STATUS_MSG[booking.status] ?? ""}</p>
        )}
      </div>
    </main>
  );
}
