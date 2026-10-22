"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AcceptBooking() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.bookings.get(Number(id)).then(setBooking).catch(() => router.push("/dashboard"));
  }, [id]);

  async function accept() {
    setLoading(true);
    try {
      const data = await api.bookings.accept(Number(id));
      setOtp(data.start_otp);
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  }

  async function decline() {
    if (!confirm("Decline this request?")) return;
    await api.bookings.cancel(Number(id));
    router.push("/dashboard");
  }

  if (!booking) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        {otp
          ? <>
              <h1 className="text-xl font-bold mb-2">Accepted ✅</h1>
              <p className="text-gray-500 text-sm mb-6">Share this start OTP with the renter in person.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center mb-4">
                <p className="text-4xl font-mono font-bold tracking-widest text-blue-700">{otp}</p>
                <p className="text-xs text-blue-400 mt-2">Start OTP — note this down, it won't show again</p>
              </div>
              <Link href="/dashboard"
                className="block text-center bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-700">
                Back to Dashboard
              </Link>
            </>
          : <>
              <h1 className="text-xl font-bold mb-2">Booking Request</h1>
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
                <p><span className="text-gray-500">Cycle:</span> <strong>{booking.cycle_title}</strong></p>
                <p><span className="text-gray-500">Renter:</span> {booking.renter_name}</p>
                <p><span className="text-gray-500">From:</span> {new Date(booking.start_time).toLocaleString()}</p>
                <p><span className="text-gray-500">To:</span> {new Date(booking.end_time).toLocaleString()}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={decline}
                  className="flex-1 border border-red-300 text-red-600 rounded-lg py-2 text-sm font-semibold hover:bg-red-50">
                  Decline
                </button>
                <button onClick={accept} disabled={loading}
                  className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                  {loading ? "Accepting…" : "Accept"}
                </button>
              </div>
            </>
        }
      </div>
    </main>
  );
}
