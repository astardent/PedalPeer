export function Contact({ label, name, email }: { label: string; name?: string; email?: string | null }) {
  if (!email) return null;
  return (
    <p className="text-xs text-gray-600 mt-1">
      {label}: {name ? `${name} · ` : ""}
      <a href={`mailto:${email}`} className="text-blue-700 hover:underline break-all">{email}</a>
    </p>
  );
}
