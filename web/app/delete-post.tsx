"use client";

import { useTransition } from "react";
import { deletePost } from "./post-actions";

export default function DeletePost({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="mt-3 text-[15px] font-semibold text-red-700 disabled:opacity-60 dark:text-red-300"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this post? Anyone who already got the notification keeps it.")) return;
        startTransition(async () => {
          const r = await deletePost(id);
          if (!r.ok) window.alert(r.error);
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
