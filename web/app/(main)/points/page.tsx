import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCheckins, getQuarters, getStandings, currentQuarter } from "@/lib/points-data";
import { isQuarter } from "@/lib/quarters";
import { sampleStandings } from "@/lib/sample-points";
import { db } from "@/lib/supabase";
import { canRunCheckins, getViewer } from "@/lib/viewer";
import PageHeader from "../../page-header";
import { CheckinList, History, Leaderboard, QuarterSwitcher, Requirements, Summary } from "../../points-view";
import ResetSample from "../../reset-sample";
import { PageSuspense } from "../../spinner";
import { card, primaryButton, secondaryButton, sectionTitle } from "../../ui";

export const metadata: Metadata = { title: "Points · KTP Hub" };

// /points?q=2026-autumn shows an earlier quarter.
export default function PointsPage({ searchParams }: PageProps<"/points">) {
  return (
    <PageSuspense label="Loading your points">
      <PointsContent searchParams={searchParams} />
    </PageSuspense>
  );
}

async function PointsContent({ searchParams }: Pick<PageProps<"/points">, "searchParams">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const now = new Date();

  // Guests get a made-up quarter, so they see what members see.
  if (viewer.role === "guest") {
    const [quarter, { data }] = await Promise.all([
      currentQuarter(),
      db().from("guest_checkins").select("created_at").eq("user_id", viewer.userId).maybeSingle(),
    ]);
    const s = sampleStandings(!!data, (data?.created_at as string | undefined) ?? null);
    return (
      <>
        <PageHeader title="Points">
          <QuarterSwitcher quarter={quarter} quarters={[quarter]} />
        </PageHeader>
        <p className="mt-1 text-sm text-muted">Sample points for guests.</p>
        <Summary tally={s.mine!} isCurrent />
        <Requirements tally={s.mine!} />
        <Leaderboard leaders={s.leaders} myRank={s.myRank} />
        <History items={s.history} now={now} empty="" />
        {data ? (
          <ResetSample />
        ) : (
          <Link href="/checkin" className={primaryButton}>
            Try checking in
          </Link>
        )}
      </>
    );
  }

  const [{ q }, quarters, thisQuarter] = await Promise.all([searchParams, getQuarters(), currentQuarter()]);
  const quarter = isQuarter(q) && quarters.includes(q) ? q : thisQuarter;
  const isCurrent = quarter === thisQuarter;
  const runsCheckins = canRunCheckins(viewer);
  const [s, checkins] = await Promise.all([
    getStandings(quarter, viewer.memberId),
    runsCheckins ? getCheckins(quarter, viewer.role === "lead" ? viewer.memberId : null) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader title="Points">
        <QuarterSwitcher quarter={quarter} quarters={quarters} />
      </PageHeader>
      {s.failed && (
        <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
          Points couldn&apos;t load. Close and reopen the app to try again.
        </p>
      )}
      {s.mine && (
        <>
          <Summary tally={s.mine} isCurrent={isCurrent} />
          <Requirements tally={s.mine} />
        </>
      )}
      <Leaderboard leaders={s.leaders} myRank={s.myRank} />
      {s.mine && (
        <History
          items={s.history}
          now={now}
          empty={
            isCurrent
              ? "Nothing yet. Tap Check in at chapter, committees and events to earn points."
              : "No points this quarter."
          }
        />
      )}

      {runsCheckins && (
        <section className={`${card} mt-8`}>
          <h2 className={sectionTitle}>{viewer.role === "board" ? "For the board" : "For committee leads"}</h2>
          <p className="mt-1 text-[15px] text-muted">
            Show a code at your event. Brothers tap Check in and scan it, and their points show up right away.
          </p>
          {isCurrent && (
            <Link href="/checkin/new" className={primaryButton}>
              Run a check-in
            </Link>
          )}
          {viewer.role === "board" && isCurrent && (
            <Link href="/points/manage" className={secondaryButton}>
              Dues and other points
            </Link>
          )}
          {checkins.length > 0 && (
            <>
              <h3 className="mt-6 font-bold">Check-ins this quarter</h3>
              <CheckinList checkins={checkins} now={now} />
            </>
          )}
        </section>
      )}
    </>
  );
}
