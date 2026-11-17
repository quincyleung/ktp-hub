import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { AccountRow, SignOutRow } from "../../account-buttons";
import BackButton from "../../back-button";
import NotificationSettings from "../../notification-settings";
import PageHeader from "../../page-header";
import { PageSuspense } from "../../spinner";

export const metadata: Metadata = { title: "Settings · KTP Hub" };

const sectionHeading = "mb-2 px-1 text-sm font-bold uppercase tracking-wide text-muted";

// Laid out like a phone's settings: grouped rows, with switches for notifications.
export default function SettingsPage() {
  return (
    <PageSuspense label="Loading settings">
      <BackButton />
      <PageHeader title="Settings" />
      <SettingsContent />
    </PageSuspense>
  );
}

async function SettingsContent() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");

  return (
    <>
      <section className="mt-6" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading" className={sectionHeading}>
          Notifications
        </h2>
        <NotificationSettings />
      </section>

      <section className="mt-8" aria-labelledby="account-heading">
        <h2 id="account-heading" className={sectionHeading}>
          Account
        </h2>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
          <li>
            <AccountRow />
          </li>
          <li>
            <SignOutRow />
          </li>
        </ul>
      </section>
    </>
  );
}
