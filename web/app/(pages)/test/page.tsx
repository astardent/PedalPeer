import Link from "next/link";

export default function TestPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-gray-900">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-2">
          🚲
        </div>
        <h1 className="text-xl font-semibold text-gray-900">PedalPeer — Test Dashboard</h1>
        <p className="text-sm text-gray-500">
          You have successfully logged in! This is currently a placeholder page while dashboard features are in progress.
        </p>
        <div className="pt-4 border-t border-gray-100 flex justify-center gap-3">
          <Link
            href="/login"
            className="text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
