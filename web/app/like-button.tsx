"use client";

import { useState, useTransition } from "react";
import { HeartIcon } from "./icons";
import { setLike } from "./post-actions";

// Shows the change right away, and undoes it if the server says no.
export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const { ok } = await setLike(postId, next);
      if (!ok) {
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={liked}
      aria-label={`${liked ? "Unlike" : "Like"}${count ? ` (${count} ${count === 1 ? "like" : "likes"})` : ""}`}
      className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-[15px] font-semibold text-muted"
    >
      <HeartIcon filled={liked} className={`h-6 w-6 ${liked ? "text-red-500" : ""}`} />
      {count > 0 && <span className={liked ? "text-red-500" : ""}>{count}</span>}
    </button>
  );
}
