import Link from "next/link";
import { Search } from "lucide-react";
import { PageTitle } from "@/components/admin/PageTitle";
import { formatDate } from "@/lib/i18n/format";
import { adminContext } from "@/server/admin/page";
import { searchUsers } from "@/server/admin/users";

export default async function AdminUsers({ params, searchParams }: PageProps<"/[locale]/admin/users">) {
  const { locale, a } = await adminContext(params);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 200) : "";
  const users = await searchUsers(q);
  const u = a.users;

  return (
    <>
      <PageTitle title={a.nav.users} />
      <form className="mb-5 flex max-w-xl gap-2" role="search">
        <input name="q" defaultValue={q} placeholder={u.searchPlaceholder} aria-label={u.searchPlaceholder} className="input" />
        <button className="btn-primary shrink-0">
          <Search className="h-4 w-4" /> <span className="hidden sm:inline">{a.common.search}</span>
        </button>
      </form>
      <div className="card overflow-x-auto">
        {users.length === 0 ? (
          <p className="p-5 text-muted">{u.noUsers}</p>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-line text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{u.email}</th>
                <th className="px-4 py-3 font-semibold">{u.name}</th>
                <th className="px-4 py-3 font-semibold">{u.joined}</th>
                <th className="px-4 py-3 font-semibold">{u.lastLogin}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((x) => (
                <tr key={x.uid} className="hover:bg-sand/40">
                  <td className="px-4 py-3">
                    <Link href={`/${locale}/admin/users/${x.uid}`} className="font-semibold hover:underline">
                      {x.email ?? x.uid}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{x.displayName || "—"}</td>
                  <td className="px-4 py-3 text-muted">{x.createdAt ? formatDate(locale, x.createdAt) : "—"}</td>
                  <td className="px-4 py-3 text-muted">{x.lastLoginAt ? formatDate(locale, x.lastLoginAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
