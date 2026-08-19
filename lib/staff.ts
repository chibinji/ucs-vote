import { getStaffSession } from "@/lib/session";

export async function requireStaff() {
  const staff = await getStaffSession();
  if (!staff) {
    return { staff: null, error: "Sign in required" as const };
  }
  return { staff, error: null };
}

export async function requireAdmin() {
  const staff = await getStaffSession();
  if (!staff) return { staff: null, error: "Sign in required" as const };
  if (staff.role !== "admin") {
    return { staff, error: "Admins only" as const };
  }
  return { staff, error: null };
}
