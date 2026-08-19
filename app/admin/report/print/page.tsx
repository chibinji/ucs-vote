import { PrintButton } from "@/components/PrintButton";
import { ReportBrand, ResultsCharts, StaffExtraCharts, type ReportData } from "@/components/ReportViews";
import { getReportPayload } from "@/lib/results";
import { getStaffSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PrintReportPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");
  const { kind } = await searchParams;
  const audience = kind === "voters" ? "voters" : "staff";
  const report = (await getReportPayload()) as ReportData;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/report" className="btn btn-ghost">
          Back to report
        </Link>
        <PrintButton />
      </div>
      <ReportBrand kind={audience} title={report.election.title} generatedAt={report.generatedAt} />
      {audience === "voters" ? (
        <p className="mb-6 text-sm">
          This sheet is for sharing with voters. It shows turnout and who is leading in each race. It
          does not show who voted for whom.
        </p>
      ) : (
        <p className="mb-6 text-sm">
          This sheet is for election officers. It includes results plus integrity, timing, and device
          checks.
        </p>
      )}
      <ResultsCharts report={report} />
      {audience === "staff" ? <StaffExtraCharts report={report} /> : null}
      <p className="mt-8 text-center text-xs">
        University of Zambia · Computer Society · Service and Excellence · Secret ballot
      </p>
    </div>
  );
}
