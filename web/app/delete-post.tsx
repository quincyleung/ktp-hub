"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deletePost } from "./post-actions";

export default function DeletePost({ id, redirectTo }: { id: string; redirectTo?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="mt-6 inline-flex h-11 items-center rounded-xl bg-red-500/10 px-4 text-[15px] font-semibold text-red-700 disabled:opacity-60 dark:text-red-300"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this post? Anyone who already got the notification keeps it.")) return;
        startTransition(async () => {
          const r = await deletePost(id);
          if (!r.ok) window.alert(r.error);
          else if (redirectTo) router.replace(redirectTo);
        });
      }}
    >
      {pending ? "Deleting…" : "Delete post"}
    </button>
  );
}
