"use client";

import { useEffect, useState } from "react";
import { ResultsCharts, StaffExtraCharts, type ReportData } from "@/components/ReportViews";

export function ReportPanel() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [receipt, setReceipt] = useState("");
  const [receiptResult, setReceiptResult] = useState("");

  useEffect(() => {
    fetch("/api/admin/report")
      .then((res) => res.json())
      .then(setReport);
  }, []);

  async function checkReceipt(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/admin/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: receipt }),
    });
    const data = await res.json();
    setReceiptResult(
      data.found ? `This receipt is in the counted set (${new Date(data.at).toLocaleString()})` : "Receipt not found",
    );
  }

  if (!report) {
    return <div className="card p-8 text-center text-sm">Building charts…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <a className="btn btn-primary" href="/admin/report/print?kind=voters" target="_blank" rel="noreferrer">
          Export voter report
        </a>
        <a className="btn btn-teal" href="/admin/report/print?kind=staff" target="_blank" rel="noreferrer">
          Export staff report
        </a>
      </div>
      <p className="text-sm">
        Voter report: results and turnout only, with logos — safe to share. Staff report: the same
        charts plus integrity, timing, and device checks. In the print window choose Save as PDF.
      </p>
      <ResultsCharts report={report} />
      <StaffExtraCharts report={report} />
      <form onSubmit={checkReceipt} className="card flex flex-wrap gap-2 p-5">
        <p className="w-full text-sm">Check a voter’s receipt code without seeing how they voted.</p>
        <input
          value={receipt}
          onChange={(e) => setReceipt(e.target.value)}
          placeholder="Receipt code e.g. K7-4MQ2"
          className="field flex-1 font-[family-name:var(--font-code)]"
        />
        <button className="btn btn-teal" type="submit">
          Check receipt
        </button>
        {receiptResult ? <p className="w-full text-sm">{receiptResult}</p> : null}
      </form>
    </div>
  );
}
