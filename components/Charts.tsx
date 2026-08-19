const TEAL = "#2C8992";
const ORANGE = "#FF9000";
const GRAY = "#454B4C";
const TRACK = "#E8E6E2";

export function TurnoutChart({
  voted,
  registered,
}: {
  voted: number;
  registered: number;
}) {
  const remaining = Math.max(registered - voted, 0);
  const total = Math.max(registered, 1);
  const votedPct = (voted / total) * 100;
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span>People who voted</span>
        <strong>
          {voted} of {registered} ({Math.round(votedPct)}%)
        </strong>
      </div>
      <div className="flex h-4 overflow-hidden rounded-full bg-[#E8E6E2]">
        <div className="h-full bg-[#2C8992]" style={{ width: `${votedPct}%` }} />
      </div>
      <div className="mt-3 flex gap-4 text-xs">
        <Legend color={TEAL} label={`Voted (${voted})`} />
        <Legend color={TRACK} label={`Not yet (${remaining})`} />
      </div>
    </div>
  );
}

export function BarList({
  items,
}: {
  items: { label: string; value: number; percent?: number }[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (items.length === 0) return <p className="text-sm">No data yet.</p>;
  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const width = Math.max((item.value / max) * 100, item.value ? 4 : 0);
        const color = index === 0 && item.value > 0 ? ORANGE : TEAL;
        return (
          <li key={item.label}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span>{item.label}</span>
              <span className="shrink-0">
                {item.value}
                {typeof item.percent === "number" ? ` · ${item.percent}%` : ""}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full" style={{ background: TRACK }}>
              <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function TimelineChart({ items }: { items: { label: string; value: number }[] }) {
  if (items.length === 0) return <p className="text-sm">No votes have been cast yet.</p>;
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="flex h-40 items-end gap-1">
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] text-[#454B4C]">{item.value || ""}</span>
          <div
            className="w-full max-w-8 rounded-t bg-[#2C8992]"
            title={`${item.label}: ${item.value}`}
            style={{ height: `${Math.max((item.value / max) * 120, item.value ? 6 : 2)}px` }}
          />
        </div>
      ))}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export const chartColors = { TEAL, ORANGE, GRAY, TRACK };
