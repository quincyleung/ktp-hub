import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentQuarter, getBoardEntries, getDues } from "@/lib/points-data";
import { quarterLabel } from "@/lib/quarters";
import { getViewer } from "@/lib/viewer";
import BackButton from "../../../back-button";
import PageHeader from "../../../page-header";
import { AddPoints, DuesList } from "../../../points-manage";
import { PageSuspense } from "../../../spinner";

export const metadata: Metadata = { title: "Dues and points · KTP Hub" };

// Board only: dues and points that don't come from a check-in, this quarter.
export default function ManagePointsPage() {
  return (
    <PageSuspense>
      <BackButton />
      <ManageContent />
    </PageSuspense>
  );
}

async function ManageContent() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (viewer.role !== "board") redirect("/points");
  const quarter = await currentQuarter();
  const [{ people, failed }, entries] = await Promise.all([getDues(quarter), getBoardEntries(quarter)]);
  return (
    <>
      <PageHeader title="Dues and points" />
      <p className="mt-1 text-[15px] text-muted">{quarterLabel(quarter)}</p>
      {failed && (
        <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
          The roster couldn&apos;t load. Close and reopen the app to try again.
        </p>
      )}
      <DuesList people={people} />
      <AddPoints people={people.map((p) => ({ id: p.id, name: p.name }))} entries={entries} />
    </>
  );
}
