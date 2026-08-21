"use client";

import { useEffect, useState } from "react";

type Snapshot = {
  election: { title: string; status: string };
  turnout: { registered: number; voted: number; percent: number };
  reconciliation: { ballots: number; votersMarked: number; ok: boolean };
  recent: { at: string; deviceType: string | null }[];
  positions: {
    id: string;
    title: string;
    total: number;
    candidates: { id: string; name: string; votes: number; percent: number }[];
  }[];
};

const POLL_MS = 9000;

export function LiveDashboard() {
  const [data, setData] = useState<Snapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/results", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        setData(await res.json());
      } catch {
        // Keep last snapshot on transient errors.
      }
    }

    void load();
    const poll = setInterval(() => {
      void load();
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, []);

  if (!data) {
    return (
      <div className="card p-8 text-center text-sm">
        Connecting to live results…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Registered" value={String(data.turnout.registered)} />
        <Stat label="Voted" value={String(data.turnout.voted)} />
        <Stat label="Turnout" value={`${data.turnout.percent}%`} />
      </div>
      <p className={`text-sm ${data.reconciliation.ok ? "text-[#2C8992]" : "text-red-700"}`}>
        Reconciliation: {data.reconciliation.ballots} ballots / {data.reconciliation.votersMarked}{" "}
        voters marked
        {data.reconciliation.ok ? " — match" : " — mismatch"}
      </p>
      {data.positions.length === 0 ? (
        <div className="card p-8 text-center text-sm">
          No races yet. Open Ballot to add positions and candidates.
        </div>
      ) : null}
      {data.positions.map((position) => (
        <section key={position.id} className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="display text-xl text-[#2C8992]">{position.title}</h2>
            <span className="text-sm">{position.total} votes</span>
          </div>
          {position.candidates.length === 0 ? (
            <p className="text-sm">No candidates for this race.</p>
          ) : (
            <ul className="space-y-3">
              {position.candidates.map((candidate) => (
                <li key={candidate.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{candidate.name}</span>
                    <span>
                      {candidate.votes} · {candidate.percent}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#454B4C]/10">
                    <div
                      className="h-full rounded-full bg-[#2C8992]"
                      style={{ width: `${Math.max(candidate.percent, candidate.votes ? 2 : 0)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <section className="card p-5">
        <h2 className="display text-xl">Recent activity</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {data.recent.map((row, index) => (
            <li key={`${row.at}-${index}`}>
              {new Date(row.at).toLocaleTimeString()} · {row.deviceType || "device"}
            </li>
          ))}
          {data.recent.length === 0 ? <li>No ballots yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide">{label}</p>
      <p className="display mt-1 text-3xl text-[#2C8992]">{value}</p>
    </div>
  );
}
