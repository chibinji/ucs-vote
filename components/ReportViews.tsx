import { BarList, TimelineChart, TurnoutChart } from "@/components/Charts";

export type ReportData = {
  generatedAt: string;
  election: { title: string; status: string };
  turnout: { registered: number; voted: number; percent: number };
  reconciliation: { ballots: number; votersMarked: number; ok: boolean };
  positions: {
    title: string;
    total: number;
    candidates: { name: string; votes: number; percent: number }[];
  }[];
  timeline: { hour: string; count: number }[];
  devices: { type: string; count: number }[];
  blocked: Record<string, number>;
};

const BLOCKED_LABELS: Record<string, string> = {
  invalid_login: "Wrong computer number or email",
  device_mismatch: "Tried to use a different device",
  otp_fail: "Wrong login code",
};

function winners(candidates: { name: string; votes: number }[]) {
  if (candidates.length === 0) return "No candidates";
  const top = Math.max(...candidates.map((c) => c.votes));
  if (top === 0) return "No votes yet";
  const names = candidates.filter((c) => c.votes === top).map((c) => c.name);
  return names.length === 1 ? names[0] : `Tie: ${names.join(", ")}`;
}

function hourLabel(hour: string) {
  const time = hour.slice(11, 16);
  return time || hour;
}

export function ReportBrand({
  kind,
  title,
  generatedAt,
}: {
  kind: "voters" | "staff";
  title: string;
  generatedAt: string;
}) {
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-[#454B4C]/10 bg-white">
      <div className="ucs-masthead flex items-center justify-between gap-4 px-5 py-5">
        <img src="/branding/unza-crest.png" alt="University of Zambia" className="h-16 w-auto object-contain" />
        <img src="/branding/ucs-lockup.png" alt="UNZA Computer Society" className="h-16 w-auto object-contain" />
      </div>
      <div className="ucs-pattern" />
      <div className="bg-[#2C8992] px-5 py-4 text-white">
        <p className="display text-2xl">{title}</p>
        <p className="mt-1 text-sm text-white/90">
          {kind === "voters" ? "Official results for voters" : "Staff insights report"}
        </p>
      </div>
      <div className="flex flex-wrap justify-between gap-2 px-5 py-3 text-xs">
        <span>UNZA Computer Society</span>
        <span>Prepared {generatedAt.replace("T", " ").slice(0, 16)}</span>
      </div>
    </div>
  );
}

export function ResultsCharts({ report }: { report: ReportData }) {
  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="display mb-4 text-xl text-[#2C8992]">Turnout</h2>
        <TurnoutChart voted={report.turnout.voted} registered={report.turnout.registered} />
      </section>
      {report.positions.map((position) => (
        <section key={position.title} className="card p-5 break-inside-avoid">
          <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
            <h2 className="display text-xl text-[#2C8992]">{position.title}</h2>
            <p className="text-sm">
              Leading: <strong>{winners(position.candidates)}</strong>
            </p>
          </div>
          <BarList
            items={position.candidates.map((candidate) => ({
              label: candidate.name,
              value: candidate.votes,
              percent: candidate.percent,
            }))}
          />
        </section>
      ))}
    </div>
  );
}

export function StaffExtraCharts({ report }: { report: ReportData }) {
  const blockedItems = Object.entries(report.blocked).map(([kind, count]) => ({
    label: BLOCKED_LABELS[kind] || "Blocked attempt",
    value: count,
  }));

  return (
    <div className="mt-6 space-y-6">
      <section className="card p-5">
        <h2 className="display mb-2 text-xl text-[#2C8992]">Integrity check</h2>
        <p className="text-sm">
          {report.reconciliation.ok
            ? `The numbers match: ${report.reconciliation.ballots} counted ballots and ${report.reconciliation.votersMarked} people marked as voted.`
            : `Warning: ${report.reconciliation.ballots} counted ballots but ${report.reconciliation.votersMarked} people are marked as voted.`}
        </p>
      </section>
      <section className="card p-5">
        <h2 className="display mb-4 text-xl text-[#2C8992]">When people voted</h2>
        <TimelineChart
          items={report.timeline.map((row) => ({ label: hourLabel(row.hour), value: row.count }))}
        />
      </section>
      <section className="card p-5">
        <h2 className="display mb-4 text-xl text-[#2C8992]">Devices used</h2>
        <BarList
          items={report.devices.map((row) => ({
            label: row.type === "phone" ? "Phone" : row.type === "desktop" ? "Computer" : "Other",
            value: row.count,
          }))}
        />
      </section>
      <section className="card p-5">
        <h2 className="display mb-4 text-xl text-[#2C8992]">Blocked sign-ins</h2>
        {blockedItems.length === 0 ? (
          <p className="text-sm">No blocked attempts.</p>
        ) : (
          <BarList items={blockedItems} />
        )}
      </section>
    </div>
  );
}
