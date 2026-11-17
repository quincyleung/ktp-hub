import { redirect } from "next/navigation";
import { BADGE } from "@/lib/roles";
import { getViewer } from "@/lib/viewer";
import HomeFeed from "../feed";
import { BrandMark } from "../page-header";
import PushSetup from "../push-setup";
import SignedOut from "../signed-out";
import { PageSuspense } from "../spinner";
import { pageTitle } from "../ui";

export default function Home() {
  return (
    <PageSuspense>
      <HomeContent />
    </PageSuspense>
  );
}

async function HomeContent() {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="relative isolate flex flex-1 flex-col items-center justify-center py-12 text-center">
          <BrandMark size={72} />
          <div className="relative mt-6">
            <div aria-hidden="true" className="halftone pointer-events-none absolute -right-10 -top-28 -z-10 h-56 w-64" />
            <h1 className="text-[30px] font-extrabold uppercase leading-tight tracking-[0.04em]">
              Kappa Theta Pi
            </h1>
          </div>
          <p className="mt-2 max-w-xs text-muted">
            UChicago&apos;s premier professional technology fraternity.
          </p>
        </header>
        <SignedOut />
      </div>
    );
  }

  if (viewer.needsProfile) redirect("/welcome");

  const firstName = viewer.name.split(" ")[0];
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className={pageTitle}>{firstName ? `Hi, ${firstName}` : "Welcome"}</h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${
            viewer.type === "board" ? "bg-navy text-white" : "bg-accent/10 text-accent"
          }`}
        >
          {BADGE[viewer.type]}
        </span>
      </div>
      <p className="mt-0.5 text-[15px] text-muted">Here&apos;s what&apos;s happening in KTP.</p>
      {viewer.role === "guest" && (
        <div className="mt-2 space-y-2">
          <p>
            You can see the chapter&apos;s events and announcements, but notifications for new posts
            go to members only.
          </p>
          <p className="text-[15px] text-muted">
            In the chapter? Sign out (tap the circle at the top right) and sign in with the email
            on the roster.
          </p>
        </div>
      )}
      <PushSetup guest={viewer.role === "guest"} />
      <HomeFeed isBoard={viewer.role === "board"} />
    </>
  );
}
