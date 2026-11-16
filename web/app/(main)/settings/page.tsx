import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { ManageAccountButton, SignOutButton } from "../../account-buttons";
import BackButton from "../../back-button";
import { ChevronRight } from "../../icons";
import PageHeader from "../../page-header";
import PushSetup from "../../push-setup";
import { Loading } from "../../spinner";
import { card } from "../../ui";

export const metadata: Metadata = { title: "Settings · KTP Hub" };

const sectionHeading = "mb-2 text-sm font-bold uppercase tracking-wide text-muted";

export default function SettingsPage() {
  return (
    <>
      <BackButton />
      <PageHeader title="Settings" />
      <Suspense fallback={<Loading />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}

async function SettingsContent() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const isMember = !!viewer.memberId;

  return (
    <>
      <section className="mt-6" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading" className={sectionHeading}>
          Notifications on this phone
        </h2>
        <PushSetup guest={viewer.role === "guest"} mode="settings" />
      </section>

      <section className="mt-8" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className={sectionHeading}>
          Privacy
        </h2>
        <div className={card}>
          <ul className="list-disc space-y-2 pl-5 text-[15px]">
            <li>Only chapter members can see People and profiles, including your email. Guests can&apos;t.</li>
            <li>Likes show as a count. No one can see who liked a post.</li>
            {isMember && <li>Change or remove your photo anytime in Edit your profile.</li>}
            <li>
              To stop notifications on one phone, turn them off in the phone&apos;s Settings →
              Notifications → KTP Hub.
            </li>
          </ul>
          <ManageAccountButton />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="profile-heading">
        <h2 id="profile-heading" className={sectionHeading}>
          Profile
        </h2>
        {isMember ? (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
            <li>
              <Link href="/me" className="flex items-center justify-between px-4 py-3 font-semibold">
                View your profile
                <ChevronRight className="h-5 w-5 text-muted" />
              </Link>
            </li>
            <li>
              <Link href="/me/edit" className="flex items-center justify-between px-4 py-3 font-semibold">
                Edit your profile
                <ChevronRight className="h-5 w-5 text-muted" />
              </Link>
            </li>
          </ul>
        ) : (
          <p className={`${card} text-[15px] text-muted`}>
            Profiles are for chapter members. You&apos;re signed in as a guest.
          </p>
        )}
      </section>

      <SignOutButton />
    </>
  );
}
