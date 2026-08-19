import { AdminNav } from "@/components/AdminNav";
import { BrandFooter, BrandHeader } from "@/components/BrandChrome";
import { getStaffSession } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getStaffSession();

  if (!staff) {
    return <>{children}</>;
  }

  return (
    <>
      <BrandHeader subtitle="Officer console" />
      <AdminNav role={staff.role} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <BrandFooter />
    </>
  );
}
