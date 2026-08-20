"use client";

import { useState } from "react";

export function ElectionControls({
  status,
  isAdmin,
}: {
  status: string;
  isAdmin: boolean;
}) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  if (!isAdmin) return null;

  async function run(action: string) {
    setBusy(action);
    setError("");
    const res = await fetch("/api/admin/election", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setBusy("");
    if (!res.ok) {
      setError(data.error || "Could not update the election.");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status !== "open" ? (
          <button
            disabled={Boolean(busy)}
            className="btn btn-primary"
            type="button"
            onClick={() => run("open")}
          >
            {busy === "open" ? "Opening…" : "Open voting"}
          </button>
        ) : (
          <button
            disabled={Boolean(busy)}
            className="btn bg-[#454B4C] text-white"
            type="button"
            onClick={() => run("close")}
          >
            {busy === "close" ? "Closing…" : "Close and freeze"}
          </button>
        )}
        {status !== "draft" ? (
          <button
            disabled={Boolean(busy)}
            className="btn btn-danger"
            type="button"
            onClick={() => {
              if (confirm("This clears ALL ballots and device bindings, then returns the election to draft. Continue?")) {
                run("restart");
              }
            }}
          >
            Restart (clears everything)
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
