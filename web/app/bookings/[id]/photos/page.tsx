"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function PhotoUpload() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([api.bookings.get(Number(id)), api.bookings.photos(Number(id))])
      .then(([b, p]) => { setBooking(b); setPhotos(p); })
      .catch(() => router.push("/dashboard"));
  }, [id]);

  const stage: "pre" | "post" | null =
    booking && user && booking.renter_id === user.id && booking.status === "active"    ? "pre"  :
    booking && user && booking.owner_id  === user.id && booking.status === "completed" ? "post" : null;

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !stage) { setMsg("Choose a photo first"); return; }
    setMsg(""); setLoading(true);
    try {
      const row = await api.bookings.uploadPhoto(Number(id), stage, file, notes || undefined);
      setPhotos(ps => [...ps, row]);
      setMsg("  Photo saved!");
      setFile(null); setPreview(null); setNotes("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) { setMsg("  " + (err.message ?? "Upload failed")); }
    finally { setLoading(false); }
  }

  const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 font-bold text-lg">PedalPeer</Link>
        <span className="text-gray-300">|</span>
        <span className="text-gray-600 text-sm">Condition Photos</span>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">

        {/* Existing photos */}
        {photos.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold mb-4">Saved photos</h2>
            <div className="grid grid-cols-2 gap-4">
              {photos.map(p => (
                <div key={p.id} className="border rounded-xl overflow-hidden">
                  <img src={`${BASE}${p.photo_path}`} alt={p.stage}
                    className="w-full h-36 object-cover" />
                  <div className="p-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.stage === "pre" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                      {p.stage === "pre" ? "Pre-ride" : "Post-ride"}
                    </span>
                    {p.notes && <p className="text-xs text-gray-400 mt-1">{p.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload form */}
        {stage ? (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold mb-1">
            {stage === "pre" ? "Pre-ride condition photos" : "Post-ride condition photos"}
          </h2>
          <p className="text-xs text-gray-400 mb-4">Optional. You can skip this.</p>
          <form onSubmit={upload} className="space-y-4">

            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition">
              {preview
                ? <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-cover" />
                : <div className="text-gray-400">
                  <p className="text-sm">Click to choose a photo</p>
                </div>
              }
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment"
                onChange={pickFile} className="hidden" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. scratch on left pedal, tyre pressure low"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {msg && <p className="text-sm">{msg}</p>}

            <button type="submit" disabled={loading || !file}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition">
              {loading ? "Uploading…" : "Save photo"}
            </button>
          </form>
        </div>
        ) : booking && (
          <p className="text-sm text-gray-500 text-center">
            {booking.status === "accepted" ? "Photos can be added once the ride starts." : "No photos to add right now."}
          </p>
        )}

        <Link href="/dashboard" className="block text-center text-sm text-gray-500 hover:text-blue-600">
          ← Back to dashboard
        </Link>
      </div>
    </main>
  );
}
