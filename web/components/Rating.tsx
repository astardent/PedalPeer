export function Rating({ value, count }: { value: number | null; count: number }) {
  if (!count) return <span className="text-xs text-gray-500">No ratings yet</span>;
  return (
    <span className="text-xs text-amber-600 font-medium">
      ★ {Number(value).toFixed(1)} <span className="text-gray-500 font-normal">({count})</span>
    </span>
  );
}
