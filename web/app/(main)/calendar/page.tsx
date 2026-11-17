import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCalendar } from "@/lib/posts";
import { getViewer } from "@/lib/viewer";
import CalendarSubscribe from "../../calendar-subscribe";
import CalendarView from "../../calendar-view";
import PageHeader from "../../page-header";
import { PageSuspense } from "../../spinner";

export const metadata: Metadata = { title: "Calendar · KTP Hub" };

// /calendar?day=2026-11-19 opens on that day (reminders link here).
export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <PageSuspense label="Loading the calendar">
      <CalendarContent searchParams={searchParams} />
    </PageSuspense>
  );
}

async function CalendarContent({ searchParams }: Pick<PageProps<"/calendar">, "searchParams">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const [{ now, items, failed }, { day }] = await Promise.all([getCalendar(), searchParams]);
  const initialDay = typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
  return (
    <>
      <PageHeader title="Calendar">
        <CalendarSubscribe />
      </PageHeader>
      {failed && (
        <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
          Board posts couldn&apos;t load. Close and reopen the app to try again.
        </p>
      )}
      <CalendarView items={items} nowIso={now.toISOString()} initialDay={initialDay} />
    </>
  );
}
