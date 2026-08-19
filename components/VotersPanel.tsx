"use client";

import { useEffect, useState } from "react";

type Voter = {
  id: string;
  computerNumber: string;
  csEmail: string;
  fullName: string | null;
  hasVoted: boolean;
  deviceLabel: string | null;
};

export function VotersPanel({ isAdmin }: { isAdmin: boolean }) {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  async function reload() {
    const res = await fetch("/api/admin/voters");
    const data = await res.json();
    setVoters(data.voters || []);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const res = await fetch("/api/admin/voters", { method: "POST", body: new FormData(form) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Upload failed.");
      return;
    }
    setMessage(`Loaded ${data.count} voters.`);
    form.reset();
    setFileName("");
    await reload();
  }

  async function addVoter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form).entries());
    const res = await fetch("/api/admin/voters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not add voter.");
      return;
    }
    setMessage("Voter added.");
    form.reset();
    await reload();
  }

  async function saveVoter(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    const res = await fetch("/api/admin/voters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not update voter.");
      return;
    }
    setEditingId(null);
    setMessage("Voter updated.");
    await reload();
  }

  async function deleteVoter(voter: Voter) {
    if (!confirm(`Remove ${voter.computerNumber} from the roll?`)) return;
    const res = await fetch("/api/admin/voters", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: voter.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete voter.");
      return;
    }
    setMessage("Voter removed.");
    await reload();
  }

  async function resetDevice(voterId: string) {
    const reason = prompt("Reason for device reset?");
    if (!reason) return;
    const res = await fetch("/api/admin/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId, reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not reset device.");
      return;
    }
    setMessage("Device reset.");
    await reload();
  }

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-[#2C8992]">{message}</p> : null}

      {isAdmin ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <form onSubmit={upload} className="card space-y-3 p-5">
            <h2 className="display text-xl">Upload CSV</h2>
            <p className="text-sm">Columns: computer_number, cs_email, full_name</p>
            <p className="text-xs text-[#454B4C]/80">
              In draft, a new upload replaces the current list. While voting is open, new rows are added.
            </p>
            <label className="btn btn-ghost w-fit cursor-pointer">
              {fileName || "Choose CSV file"}
              <input
                required
                name="file"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Upload list
            </button>
          </form>

          <form onSubmit={addVoter} className="card space-y-3 p-5">
            <h2 className="display text-xl">Add one voter</h2>
            <input name="computerNumber" required placeholder="Computer number" className="field" />
            <input name="csEmail" required type="email" placeholder="CS email" className="field" />
            <input name="fullName" placeholder="Full name (optional)" className="field" />
            <button className="btn btn-teal" type="submit">
              Add voter
            </button>
          </form>
        </div>
      ) : null}

      <div className="card overflow-x-auto p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="display text-xl">Roll ({voters.length})</h2>
        </div>
        {voters.length === 0 ? (
          <p className="py-8 text-center text-sm">No registered voters yet. Upload a CSV or add one by hand.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="table-head">
                <th className="py-2 pr-3">Computer no.</th>
                <th className="pr-3">Email</th>
                <th className="pr-3">Name</th>
                <th className="pr-3">Voted</th>
                <th className="pr-3">Device</th>
                {isAdmin ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {voters.map((voter) => (
                <tr key={voter.id} className="border-t border-[#454B4C]/10 align-top">
                  {editingId === voter.id ? (
                    <td colSpan={isAdmin ? 6 : 5} className="py-3">
                      <form
                        className="grid gap-2 sm:grid-cols-4"
                        onSubmit={(event) => saveVoter(event, voter.id)}
                      >
                        <input name="computerNumber" defaultValue={voter.computerNumber} className="field" required />
                        <input name="csEmail" defaultValue={voter.csEmail} type="email" className="field" required />
                        <input name="fullName" defaultValue={voter.fullName || ""} className="field" />
                        <div className="flex gap-2">
                          <button className="btn btn-teal" type="submit">
                            Save
                          </button>
                          <button className="btn btn-ghost" type="button" onClick={() => setEditingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="py-3 pr-3 font-[family-name:var(--font-code)]">{voter.computerNumber}</td>
                      <td className="pr-3">{voter.csEmail}</td>
                      <td className="pr-3">{voter.fullName || "—"}</td>
                      <td className="pr-3">{voter.hasVoted ? "Yes" : "No"}</td>
                      <td className="max-w-[12rem] truncate pr-3" title={voter.deviceLabel || ""}>
                        {voter.deviceLabel || "—"}
                      </td>
                      {isAdmin ? (
                        <td className="whitespace-nowrap py-3">
                          <div className="flex flex-wrap gap-2">
                            {!voter.hasVoted ? (
                              <>
                                <button className="btn btn-ghost" type="button" onClick={() => setEditingId(voter.id)}>
                                  Edit
                                </button>
                                <button className="btn btn-danger" type="button" onClick={() => deleteVoter(voter)}>
                                  Delete
                                </button>
                              </>
                            ) : null}
                            {voter.deviceLabel ? (
                              <button className="btn btn-ghost" type="button" onClick={() => resetDevice(voter.id)}>
                                Reset device
                              </button>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
