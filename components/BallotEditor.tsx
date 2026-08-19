"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Candidate = { id: string; name: string; hasPhoto?: boolean };
type Position = { id: string; title: string; candidates: Candidate[] };

export function BallotEditor({
  positions,
  locked,
  isAdmin,
}: {
  positions: Position[];
  locked: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<string | null>(null);

  async function refresh(okMessage: string) {
    setError("");
    setMessage(okMessage);
    router.refresh();
  }

  async function addPosition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = String(new FormData(form).get("title") || "").trim();
    const res = await fetch("/api/admin/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not add position.");
    form.reset();
    await refresh("Position added.");
  }

  async function renamePosition(id: string, title: string) {
    const res = await fetch("/api/admin/positions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not rename position.");
    setEditingPosition(null);
    await refresh("Position updated.");
  }

  async function deletePosition(id: string, title: string) {
    if (!confirm(`Delete “${title}” and its candidates?`)) return;
    const res = await fetch("/api/admin/positions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not delete position.");
    await refresh("Position deleted.");
  }

  async function addCandidate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const res = await fetch("/api/admin/candidates", {
      method: "POST",
      body: new FormData(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not add candidate.");
    form.reset();
    await refresh("Candidate added.");
  }

  async function updateCandidate(id: string, name?: string, photo?: File) {
    const body = new FormData();
    body.set("id", id);
    if (name) body.set("name", name);
    if (photo) body.set("photo", photo);
    const res = await fetch("/api/admin/candidates", { method: "PATCH", body });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not update candidate.");
    setEditingCandidate(null);
    await refresh(photo ? "Photo updated." : "Candidate updated.");
  }

  async function deleteCandidate(id: string, name: string) {
    if (!confirm(`Remove ${name} from the ballot?`)) return;
    const res = await fetch("/api/admin/candidates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not delete candidate.");
    await refresh("Candidate removed.");
  }

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-[#2C8992]">{message}</p> : null}

      {isAdmin && !locked ? (
        <form onSubmit={addPosition} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <input name="title" required placeholder="New position, e.g. Treasurer" className="field" />
          <button className="btn btn-teal shrink-0" type="submit">
            Add position
          </button>
        </form>
      ) : (
        <p className="rounded-xl bg-white px-4 py-3 text-sm">
          {locked
            ? "Ballot is locked while voting is open or closed. Close and restart to edit."
            : "Observer view — you can see the ballot but cannot change it."}
        </p>
      )}

      {positions.length === 0 ? (
        <div className="card p-8 text-center text-sm">
          No positions yet. Add President, Secretary, or any race you need.
        </div>
      ) : null}

      {positions.map((position) => (
        <section key={position.id} className="card p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            {editingPosition === position.id && isAdmin && !locked ? (
              <form
                className="flex min-w-[16rem] flex-1 gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const title = String(new FormData(event.currentTarget).get("title") || "");
                  void renamePosition(position.id, title);
                }}
              >
                <input name="title" defaultValue={position.title} className="field" required />
                <button className="btn btn-teal" type="submit">
                  Save
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setEditingPosition(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <h2 className="display text-2xl text-[#2C8992]">{position.title}</h2>
            )}
            {isAdmin && !locked && editingPosition !== position.id ? (
              <div className="flex gap-2">
                <button className="btn btn-ghost" type="button" onClick={() => setEditingPosition(position.id)}>
                  Rename
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => deletePosition(position.id, position.title)}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>

          {position.candidates.length === 0 ? (
            <p className="mb-4 text-sm">No candidates on this race yet.</p>
          ) : (
            <ul className="space-y-2">
              {position.candidates.map((candidate) => (
                <li
                  key={candidate.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#454B4C]/10 p-3"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-[#2C8992] text-center text-sm leading-[3rem] text-white">
                    {candidate.hasPhoto ? (
                      <img
                        src={`/api/candidates/${candidate.id}/photo`}
                        alt=""
                        className="h-12 w-12 object-cover"
                      />
                    ) : (
                      candidate.name[0]
                    )}
                  </div>
                  {editingCandidate === candidate.id && isAdmin && !locked ? (
                    <form
                      className="flex min-w-[12rem] flex-1 flex-wrap gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const name = String(new FormData(event.currentTarget).get("name") || "");
                        void updateCandidate(candidate.id, name);
                      }}
                    >
                      <input name="name" defaultValue={candidate.name} className="field max-w-xs" required />
                      <button className="btn btn-teal" type="submit">
                        Save
                      </button>
                      <button className="btn btn-ghost" type="button" onClick={() => setEditingCandidate(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <span className="flex-1 font-medium">{candidate.name}</span>
                  )}
                  {isAdmin && editingCandidate !== candidate.id ? (
                    <div className="ml-auto flex flex-wrap gap-2">
                      <label className="btn btn-ghost cursor-pointer">
                        Photo
                        <input
                          className="hidden"
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void updateCandidate(candidate.id, undefined, file);
                          }}
                        />
                      </label>
                      {!locked ? (
                        <>
                          <button
                            className="btn btn-ghost"
                            type="button"
                            onClick={() => setEditingCandidate(candidate.id)}
                          >
                            Rename
                          </button>
                          <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => deleteCandidate(candidate.id, candidate.name)}
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {isAdmin && !locked ? (
            <form onSubmit={addCandidate} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input type="hidden" name="positionId" value={position.id} />
              <input name="name" required placeholder="Candidate name" className="field" />
              <input name="photo" type="file" accept="image/*" className="text-sm file:mr-2 file:rounded-full file:border-0 file:bg-[#2C8992]/10 file:px-3 file:py-2 file:text-[#2C8992]" />
              <button className="btn btn-primary" type="submit">
                Add candidate
              </button>
            </form>
          ) : null}
        </section>
      ))}
    </div>
  );
}
