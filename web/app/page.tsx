import { Suspense } from "react";
import { UserButton } from "@clerk/nextjs";
import { getViewer, type Viewer } from "@/lib/viewer";
import Feed from "./feed";
import PostForm from "./post-form";
import PushSetup from "./push-setup";
import SignedOut from "./signed-out";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-10">
      <Suspense fallback={<Header />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-accent">
          Kappa Theta Pi
        </p>
        <h1 className="font-serif text-4xl leading-tight">KTP Hub</h1>
      </div>
      {right && <div className="pt-2">{right}</div>}
    </header>
  );
}

function Welcome({ viewer }: { viewer: Viewer }) {
  const firstName = viewer.name.split(" ")[0];
  if (viewer.role === "guest") {
    return (
      <p className="mb-6">
        Hi {firstName}. You&apos;re signed in as a <b>guest</b>, so you&apos;ll see sample posts.
        If you&apos;re in the chapter, sign out and sign in with the email on the roster.
      </p>
    );
  }
  return (
    <p className="mb-6">
      Hi {firstName}.{viewer.role === "board" && <> You&apos;re on the board.</>}
    </p>
  );
}

async function HomeContent() {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <>
        <Header />
        <p className="mb-6 text-muted">Chapter events and announcements, sent to your phone.</p>
        <SignedOut />
      </>
    );
  }

  return (
    <>
      <Header right={<UserButton />} />
      <Welcome viewer={viewer} />
      <PushSetup />
      {viewer.role === "board" && <PostForm />}
      <Suspense fallback={<p className="mt-8 text-muted">Loading posts…</p>}>
        <Feed viewer={viewer} />
      </Suspense>
    </>
  );
}
