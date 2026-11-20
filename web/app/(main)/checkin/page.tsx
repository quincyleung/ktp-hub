import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { canRunCheckins, getViewer } from "@/lib/viewer";
import PageHeader from "../../page-header";
import Scanner from "../../scanner";
import { PageSuspense } from "../../spinner";

export const metadata: Metadata = { title: "Check in · KTP Hub" };

// The round Check in button in the middle of the tabs.
export default function CheckinPage() {
  return (
    <PageSuspense label="Opening the camera">
      <CheckinContent />
    </PageSuspense>
  );
}

async function CheckinContent() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  return (
    <>
      <PageHeader title="Check in">
        {canRunCheckins(viewer) && (
          <Link href="/checkin/new" className="text-[15px] font-semibold text-accent">
            Show a code
          </Link>
        )}
      </PageHeader>
      <Scanner guest={viewer.role === "guest"} />
    </>
  );
}
