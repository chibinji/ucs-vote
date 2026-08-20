"use client";

import { useState } from "react";
import { ElectionControls } from "@/components/AdminActions";

export function ElectionHeader({
  title,
  status,
  isAdmin,
}: {
  title: string;
  status: string;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = String(new FormData(event.currentTarget).get("title") || "").trim();
    const res = await fetch("/api/admin/election", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rename", title: nextTitle }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not rename.");
      return;
    }
    window.location.reload();
  }

  const badge = status === "open" ? "badge-open" : status === "closed" ? "badge-closed" : "badge-draft";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {editing && isAdmin ? (
            <form className="flex max-w-xl gap-2" onSubmit={save}>
              <input name="title" defaultValue={title} className="field" required />
              <button className="btn btn-teal" type="submit">
                Save
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="display text-3xl text-[#2C8992]">{title}</h1>
              <span className={`badge ${badge}`}>{status}</span>
              {isAdmin ? (
                <button className="btn btn-ghost" type="button" onClick={() => setEditing(true)}>
                  Rename
                </button>
              ) : null}
            </div>
          )}
          <p className="mt-2 text-sm">
            {status === "draft"
              ? "Upload voters and finish the ballot, then open voting."
              : status === "open"
                ? "Students can vote from the shared link. Results update here live."
                : "Voting is frozen. Download the report or restart to edit."}
          </p>
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        </div>
      </div>
      <ElectionControls status={status} isAdmin={isAdmin} />
    </div>
  );
}
