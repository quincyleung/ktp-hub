import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SUBSCRIBE_GOOGLE, SUBSCRIBE_WEBCAL } from "@/lib/chapter";
import { getCalendar } from "@/lib/posts";
import { getViewer } from "@/lib/viewer";
import CalendarView from "../../calendar-view";
import PageHeader from "../../page-header";
import { Loading } from "../../spinner";
import { card } from "../../ui";

export const metadata: Metadata = { title: "Calendar · KTP Hub" };

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendar" subtitle="Every chapter event, in one place" />
      <Suspense fallback={<Loading label="Loading the calendar" />}>
        <CalendarContent />
      </Suspense>
      <section className={`${card} mt-8`}>
        <h2 className="text-lg font-bold tracking-tight">Put KTP events in your calendar</h2>
        <p className="mt-1 text-[15px] text-muted">
          Subscribe once and the chapter&apos;s Google Calendar stays in sync on your phone.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={SUBSCRIBE_GOOGLE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-background px-3 text-[15px] font-semibold transition active:opacity-80"
          >
            Google Calendar
          </a>
          <a
            href={SUBSCRIBE_WEBCAL}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-background px-3 text-[15px] font-semibold transition active:opacity-80"
          >
            Apple or Outlook
          </a>
        </div>
      </section>
    </>
  );
}

async function CalendarContent() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const { now, items, failed } = await getCalendar();
  return (
    <>
      {failed && (
        <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
          Board posts couldn&apos;t load. Close and reopen the app to try again.
        </p>
      )}
      <CalendarView items={items} nowIso={now.toISOString()} />
    </>
  );
}
