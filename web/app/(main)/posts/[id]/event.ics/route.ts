import { eventIcs } from "@/lib/ics";
import { getPost } from "@/lib/posts";
import { getViewer } from "@/lib/viewer";

// "Add to Apple or Outlook calendar" for one board-posted event.
export async function GET(request: Request, { params }: RouteContext<"/posts/[id]/event.ics">) {
  const viewer = await getViewer();
  if (!viewer) return new Response("Sign in first.", { status: 401 });

  const { id } = await params;
  const post = await getPost(id);
  if (!post || post.kind !== "event" || !post.starts_at) {
    return new Response("That event doesn't exist.", { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const ics = eventIcs({
    id: post.id,
    title: post.title,
    start: new Date(post.starts_at),
    location: post.location,
    details: post.body,
    url: `${origin}/posts/${post.id}`,
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="ktp-event.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
