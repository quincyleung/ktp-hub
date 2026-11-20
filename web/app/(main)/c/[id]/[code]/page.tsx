import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { BrandMark } from "../../../../page-header";
import LinkCheckin from "../../../../link-checkin";
import { PageSuspense } from "../../../../spinner";
import { card, primaryButton } from "../../../../ui";

export const metadata: Metadata = { title: "Check in · KTP Hub" };

// Where a check-in QR code's link goes when it's scanned with a phone's own
// Camera app instead of KTP Hub's Check in. On iPhone that opens Safari, where
// the brother isn't signed in (the home-screen app keeps its own sign-in), so
// point them back to the app. Signed in here (say, on Android), one tap checks in.
export default function CodeLinkPage({ params }: PageProps<"/c/[id]/[code]">) {
  return (
    <PageSuspense>
      <CodeLink params={params} />
    </PageSuspense>
  );
}

async function CodeLink({ params }: Pick<PageProps<"/c/[id]/[code]">, "params">) {
  const [{ userId }, { id, code }] = await Promise.all([auth(), params]);
  if (userId) {
    return (
      <section className="pt-6 text-center">
        <h1 className="text-[26px] font-bold tracking-tight">Check in</h1>
        <LinkCheckin scanned={`/c/${id}/${code}`} />
      </section>
    );
  }
  return (
    <section className="flex flex-1 flex-col items-center justify-center py-10 text-center">
      <BrandMark size={64} />
      <h1 className="mt-6 text-[26px] font-bold tracking-tight">Check in with KTP Hub</h1>
      <div className={`${card} mt-6 text-left`}>
        <p>
          Open <strong>KTP Hub</strong> from your home screen, tap the round <strong>Check in</strong> button, and
          scan the code again.
        </p>
        <p className="mt-2 text-[15px] text-muted">
          Your phone&apos;s camera opened the code in the browser, where you&apos;re not signed in.
        </p>
      </div>
      <Link href="/" className={primaryButton}>
        Don&apos;t have the app? Get it here
      </Link>
    </section>
  );
}
