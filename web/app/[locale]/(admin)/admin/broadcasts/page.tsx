import { BroadcastManager } from "@/components/admin/BroadcastManager";
import { PageTitle } from "@/components/admin/PageTitle";
import { adminContext } from "@/server/admin/page";
import { listBroadcasts } from "@/server/broadcasts";

export default async function AdminBroadcasts({ params }: PageProps<"/[locale]/admin/broadcasts">) {
  const { a } = await adminContext(params);
  const rows = await listBroadcasts();
  return (
    <>
      <PageTitle title={a.nav.broadcasts} hint={a.broadcasts.hint} />
      <BroadcastManager rows={rows} />
    </>
  );
}
