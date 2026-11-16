import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPeople } from "@/lib/people";
import { getViewer } from "@/lib/viewer";
import PageHeader from "../../page-header";
import PeopleView from "../../people-view";
import { Loading } from "../../spinner";

export const metadata: Metadata = { title: "People · KTP Hub" };

export default function PeoplePage() {
  return (
    <>
      <PageHeader title="People" subtitle="Discover who's in the chapter" />
      <Suspense fallback={<Loading label="Loading the directory" />}>
        <PeopleContent />
      </Suspense>
    </>
  );
}

// The roster has members' names and emails, so guests don't see it.
async function PeopleContent() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (viewer.role === "guest") {
    return (
      <p className="mt-2 text-muted">
        The chapter directory is for members only. Sign in with the email on the roster to see it.
      </p>
    );
  }
  const { people, failed } = await getPeople();
  if (failed) {
    return (
      <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
        The directory couldn&apos;t load. Close and reopen the app to try again.
      </p>
    );
  }
  return <PeopleView people={people} isBoard={viewer.role === "board"} myId={viewer.memberId} />;
}
