import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/people";
import { gradYearOptions, splitList } from "@/lib/profile-fields";
import { getViewer } from "@/lib/viewer";
import OnboardingForm from "../onboarding-form";
import { BrandMark } from "../page-header";
import { pageTitle } from "../ui";
import { Loading } from "../spinner";

export const metadata: Metadata = { title: "Welcome · KTP Hub" };

// First sign-in for members: photo, graduation year, majors and minors.
// Home sends members here until they have a graduation year and a major.
// It sits outside the tabs so it reads as one step, not another page.
export default function WelcomePage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-[calc(env(safe-area-inset-top)+2.5rem)]">
      <Suspense fallback={<Loading />}>
        <Welcome />
      </Suspense>
    </main>
  );
}

async function Welcome() {
  const viewer = await getViewer();
  if (!viewer?.memberId) redirect("/"); // signed out, or a guest (guests have no profile)
  const profile = await getProfile(viewer.memberId);
  if (!profile) {
    return <p className="text-muted">Your profile couldn&apos;t load. Close and reopen the app to try again.</p>;
  }

  const firstName = viewer.name.split(" ")[0];
  return (
    <>
      <header className="relative isolate">
        <div aria-hidden="true" className="halftone pointer-events-none absolute -right-6 -top-14 -z-10 h-56 w-64" />
        <BrandMark size={48} />
        <p className="mt-5 text-[13px] font-bold uppercase tracking-[0.08em] text-accent">Welcome to KTP Hub</p>
        <h1 className={`${pageTitle} mt-1`}>Hi {firstName}, set up your profile</h1>
        <p className="mt-2 text-muted">
          A few details so brothers know who you are. Only chapter members can see your profile.
        </p>
      </header>
      <OnboardingForm
        name={profile.name}
        years={gradYearOptions(new Date(), profile.year)}
        year={profile.year}
        majors={splitList(profile.major)}
        minors={splitList(profile.minor)}
      />
    </>
  );
}
