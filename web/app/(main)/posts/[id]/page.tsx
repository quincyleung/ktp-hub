import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { mapsUrl } from "@/lib/chapter";
import { googleCalendarLink } from "@/lib/ics";
import { getPost } from "@/lib/posts";
import { clockTime, longDate, timeAgo } from "@/lib/time";
import { getViewer } from "@/lib/viewer";
import BackButton from "../../../back-button";
import DeletePost from "../../../delete-post";
import { ClockIcon, PinIcon } from "../../../icons";
import Linkified from "../../../linkified";
import { pageTitle } from "../../../ui";
import { Loading } from "../../../spinner";

// One event or announcement. Notifications open this page.
export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <>
      <BackButton />
      <Suspense fallback={<Loading />}>
        <PostView params={params} />
      </Suspense>
    </>
  );
}

const button =
  "inline-flex h-12 w-full items-center justify-center rounded-xl border border-line bg-background px-4 font-semibold transition active:opacity-80";

async function PostView({ params }: Pick<PageProps<"/posts/[id]">, "params">) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const post = await getPost(id);
  if (!post) notFound();

  const now = new Date();
  const start = post.kind === "event" && post.starts_at ? new Date(post.starts_at) : null;
  const host = (await headers()).get("host");
  const url = `https://${host}/posts/${post.id}`;
  const calendarEvent = start && {
    id: post.id,
    title: post.title,
    start,
    location: post.location,
    details: post.body,
    url,
  };

  return (
    <article>
      <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-accent">
        {start ? "Event" : "Announcement"}
      </p>
      <h1 className={`${pageTitle} mt-1`}>{post.title}</h1>

      {start && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-3">
            <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p>
              <span className="block font-semibold">{longDate(start)}</span>
              <span className="text-muted">
                {clockTime(start)}
                {start.getTime() < now.getTime() && " (already started)"}
              </span>
            </p>
          </div>
          {post.location && (
            <div className="flex gap-3">
              <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <p>
                <span className="block font-semibold">{post.location}</span>
                <a
                  href={mapsUrl(post.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] font-semibold text-accent underline underline-offset-2"
                >
                  Open in Maps
                </a>
              </p>
            </div>
          )}
        </div>
      )}

      {post.body && (
        <p className="mt-5 whitespace-pre-line break-words">
          <Linkified text={post.body} />
        </p>
      )}

      {calendarEvent && (
        <section className="mt-6">
          <h2 className="mb-2 font-semibold">Add to your calendar</h2>
          <div className="grid grid-cols-2 gap-2">
            <a href={googleCalendarLink(calendarEvent)} target="_blank" rel="noopener noreferrer" className={button}>
              Google
            </a>
            <a href={`/posts/${post.id}/event.ics`} className={button}>
              Apple or Outlook
            </a>
          </div>
        </section>
      )}

      <p className="mt-6 text-sm text-muted">
        Posted by {post.created_by.split(" ")[0]} · {timeAgo(new Date(post.created_at), now)}
      </p>
      {viewer.role === "board" && <DeletePost id={post.id} redirectTo="/" />}
    </article>
  );
}
