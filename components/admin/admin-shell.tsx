import "server-only";

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import type { AdminSessionPayload } from "@/lib/auth/admin-session";
import { type AdminCapability, adminCan } from "@/lib/auth/permissions";
import { getCurrentAdmin } from "@/lib/auth/require-admin";
import { PanelShell } from "@/components/dashboard/panel-shell";

const adminNav = [
  { href: "/admin/dashboard", label: "डैशबोर्ड", hint: "Dashboard" },
  { href: "/admin/sangh-leaders", label: "संघ के मुख्य व्यक्ति", hint: "Sangh Leaders" },
  { href: "/admin/karyakarta", label: "कार्यकर्ता", hint: "Karyakarta" },
  { href: "/admin/id-cards", label: "ID कार्ड प्रबंधन", hint: "ID Card Management" },
  { href: "/admin/applications", label: "आवेदन", hint: "Applications" },
  { href: "/admin/settings", label: "सेटिंग्स", hint: "Settings" },
];

/** Server-side guard for admin pages. Redirects anonymous users and blocks roles without the capability. */
export async function requireAdminPage(capability: AdminCapability = "view"): Promise<AdminSessionPayload> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (!adminCan(admin.role, capability)) redirect("/admin/dashboard");
  return admin;
}

export function AdminShell({
  admin,
  title,
  description,
  actions,
  children,
}: {
  admin: AdminSessionPayload;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <PanelShell
      panelLabel="Admin Panel"
      userName={admin.name}
      userMeta={admin.role.replaceAll("_", " ")}
      navItems={adminNav}
      logoutEndpoint="/api/auth/admin/logout"
      logoutRedirect="/admin/login"
      title={title}
      description={description}
      actions={actions}
    >
      {children}
    </PanelShell>
  );
}
