import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BADGE } from "@/lib/roles";
import { getViewer } from "@/lib/viewer";
import HomeFeed from "../feed";
import { BrandMark } from "../page-header";
import PushSetup from "../push-setup";
import SignedOut from "../signed-out";
import { Loading } from "../spinner";
import { pageTitle } from "../ui";

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <>
        <header className="relative isolate mb-8">
          <div aria-hidden="true" className="halftone pointer-events-none absolute -right-6 -top-12 -z-10 h-64 w-72" />
          <BrandMark size={56} />
          <p className="mt-5 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Kappa Theta Pi</p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            <span className="text-accent">KTP</span> Hub
          </h1>
          <p className="mt-1 text-muted">Chapter events and announcements, sent to your phone.</p>
        </header>
        <SignedOut />
      </>
    );
  }

  if (viewer.needsProfile) redirect("/welcome");

  const firstName = viewer.name.split(" ")[0];
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className={pageTitle}>Hi, {firstName}</h1>
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
      <Suspense fallback={<Loading label="Loading posts" />}>
        <HomeFeed isBoard={viewer.role === "board"} />
      </Suspense>
    </>
  );
}
