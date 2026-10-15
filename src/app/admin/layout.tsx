import AdminShell from './AdminShell';
import { requireAdminPage } from './_lib/load';

export const dynamic = 'force-dynamic';

/**
 * Layout serveur de l'administration : revérifie en base le rôle admin
 * (en plus de src/proxy.ts) avant de rendre quoi que ce soit.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
