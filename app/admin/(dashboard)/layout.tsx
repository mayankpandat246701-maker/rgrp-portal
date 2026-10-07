import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <AdminShell
      adminName={admin?.name ?? "Admin"}
      adminRole={admin?.role ?? "ADMIN"}
    >
      {children}
    </AdminShell>
  );
}
