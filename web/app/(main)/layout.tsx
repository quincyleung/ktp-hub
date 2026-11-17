import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getLatestPostAt } from "@/lib/posts";
import { Bell } from "../bell";
import { BrandMark } from "../page-header";
import ProfileMenu from "../profile-menu";
import { PageLoading } from "../spinner";
import TabBar from "../tab-bar";

// Signed in: a top bar (bell and profile) and tabs at the bottom.
// Signed out: just the page (Home shows the welcome screen, with sign-up or install steps).
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[calc(env(safe-area-inset-top)+2.5rem)]">
        {children}
      </main>
    );
  }
  return (
    <>
      <header className="sticky top-0 z-20 animate-fade-in border-b border-line bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size={30} />
            <span className="text-lg font-bold tracking-tight">KTP Hub</span>
          </Link>
          <div className="flex items-center gap-1">
            <Suspense fallback={<Bell latest={null} />}>
              <BellWithDot />
            </Suspense>
            <ProfileMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-6">{children}</main>
      <TabBar />
    </>
  );
}

async function BellWithDot() {
  return <Bell latest={await getLatestPostAt()} />;
}
