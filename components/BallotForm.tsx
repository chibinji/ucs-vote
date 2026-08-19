"use client";

import { markVoteComplete, VoteLock } from "@/components/VoteLock";
import { useMemo, useState } from "react";

type Candidate = { id: string; name: string; hasPhoto: boolean };
type Position = { id: string; title: string; candidates: Candidate[] };

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function BallotForm({ positions }: { positions: Position[] }) {
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = useMemo(
    () => positions.every((position) => Boolean(choices[position.id])),
    [choices, positions],
  );

  async function cast(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) {
      setError("Select one candidate for every position.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/vote/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choices,
          deviceLabel: `${navigator.platform} · ${navigator.userAgent}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not cast vote.");
      sessionStorage.setItem("ucs-receipt", data.receipt);
      markVoteComplete();
      window.location.replace("/vote/receipt");
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cast vote.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={cast} className="mx-auto w-full max-w-2xl space-y-8 pb-10">
      <VoteLock mode="ballot" />
      {positions.map((position) => (
        <section key={position.id} className="card p-5">
          <h2 className="display text-2xl text-[#2C8992]">{position.title}</h2>
          <p className="mb-4 text-sm">Choose one candidate.</p>
          <div className="grid gap-3">
            {position.candidates.map((candidate) => {
              const selected = choices[position.id] === candidate.id;
              return (
                <label
                  key={candidate.id}
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-3 ${
                    selected
                      ? "border-[#2C8992] ring-2 ring-[#2C8992]"
                      : "border-[#454B4C]/15"
                  }`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name={position.id}
                    checked={selected}
                    onChange={() =>
                      setChoices((current) => ({ ...current, [position.id]: candidate.id }))
                    }
                  />
                  {candidate.hasPhoto ? (
                    <img
                      src={`/api/candidates/${candidate.id}/photo`}
                      alt={candidate.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2C8992] font-[family-name:var(--font-display)] text-xl text-white">
                      {initials(candidate.name)}
                    </div>
                  )}
                  <span className="text-lg font-medium">{candidate.name}</span>
                </label>
              );
            })}
          </div>
        </section>
      ))}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        disabled={busy}
        className="btn-primary w-full rounded-full px-5 py-4 text-lg disabled:opacity-60"
        type="submit"
      >
        {busy ? "Submitting…" : "Cast vote"}
      </button>
    </form>
  );
}
