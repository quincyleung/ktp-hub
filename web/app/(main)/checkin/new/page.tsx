import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCheckins, getTodaysEvents, currentQuarter } from "@/lib/points-data";
import { clockTime } from "@/lib/time";
import { canRunCheckins, getViewer } from "@/lib/viewer";
import BackButton from "../../../back-button";
import PageHeader from "../../../page-header";
import { CheckinList } from "../../../points-view";
import { PageSuspense } from "../../../spinner";
import StartCheckin from "../../../start-checkin";
import { sectionTitle } from "../../../ui";

export const metadata: Metadata = { title: "Run a check-in · KTP Hub" };

export default function NewCheckinPage() {
  return (
    <PageSuspense>
      <BackButton />
      <NewCheckinContent />
    </PageSuspense>
  );
}

async function NewCheckinContent() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (!canRunCheckins(viewer)) redirect("/checkin");
  const now = new Date();
  const [events, checkins] = await Promise.all([
    getTodaysEvents(),
    currentQuarter().then((q) => getCheckins(q, viewer.role === "lead" ? viewer.memberId : null)),
  ]);
  const open = checkins.filter((c) => Date.parse(c.startsAt) <= now.getTime() && now.getTime() < Date.parse(c.endsAt));
  return (
    <>
      <PageHeader title="Run a check-in" />
      {open.length > 0 && (
        <section className="mt-4">
          <h2 className={sectionTitle}>Open now</h2>
          <CheckinList checkins={open} now={now} />
        </section>
      )}
      <StartCheckin
        isLead={viewer.role === "lead"}
        events={events.map((e) => ({
          key: e.key,
          title: e.title,
          time: `${clockTime(new Date(e.start))} – ${clockTime(new Date(e.end!))}${e.location ? ` · ${e.location}` : ""}`,
        }))}
      />
    </>
  );
}
