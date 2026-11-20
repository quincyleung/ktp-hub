import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SAMPLE_ID } from "@/lib/scan";
import { requirement, type Category } from "@/lib/points";
import { UUID } from "@/lib/posts";
import { SAMPLE_EVENT } from "@/lib/sample-points";
import { db } from "@/lib/supabase";
import { getViewer } from "@/lib/viewer";
import BackButton from "../../../back-button";
import CheckinDisplay from "../../../checkin-display";
import { PageSuspense } from "../../../spinner";
import { pageTitle } from "../../../ui";

export const metadata: Metadata = { title: "Check-in code · KTP Hub" };

// /checkin/<id>: the code for one check-in. /checkin/sample: the guests' sample.
export default function CheckinCodePage({ params }: PageProps<"/checkin/[id]">) {
  return (
    <PageSuspense>
      <BackButton />
      <CodeContent params={params} />
    </PageSuspense>
  );
}

async function CodeContent({ params }: Pick<PageProps<"/checkin/[id]">, "params">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const { id } = await params;

  if (id === SAMPLE_ID) {
    return (
      <>
        <Heading title={SAMPLE_EVENT.title} category={SAMPLE_EVENT.category} points={SAMPLE_EVENT.points} />
        <p className="mt-1 text-sm text-muted">
          A sample for guests. Scan it with KTP Hub&apos;s Check in on another phone, signed in as a guest.
        </p>
        <CheckinDisplay id={SAMPLE_ID} canRemove={false} canEnd={false} />
      </>
    );
  }

  if (!UUID.test(id)) notFound();
  const { data: c } = await db()
    .from("checkins")
    .select("title, category, points, created_by")
    .eq("id", id)
    .maybeSingle();
  const mine = viewer.role === "lead" && c?.created_by === viewer.memberId;
  if (!c || !(viewer.role === "board" || mine)) notFound();

  return (
    <>
      <Heading title={c.title as string} category={c.category as Category} points={c.points as number} />
      <CheckinDisplay id={id} canRemove={viewer.role === "board"} canEnd />
    </>
  );
}

function Heading({ title, category, points }: { title: string; category: Category; points: number }) {
  return (
    <header>
      <h1 className={pageTitle}>{title}</h1>
      <p className="mt-1 font-semibold text-accent">
        {requirement(category).label} · {points} {points === 1 ? "point" : "points"}
      </p>
    </header>
  );
}
