"use client";

import { useUser } from "@clerk/nextjs";
import { useRef, useState } from "react";
import Avatar from "./avatar";
import { Spinner } from "./spinner";

const MAX_SIDE = 800; // pixels; plenty for a profile circle

// Phone photos can be 5+ MB (or HEIC, which the sign-in service won't take).
// Redraw them as a smaller JPEG first. If the browser can't, send the original.
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], "profile.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

// The profile photo lives on the sign-in account (the same photo as the
// circle at the top right). The app copies it to the roster on the next page load.
export default function PhotoPicker({
  name,
  onBusyChange,
}: {
  name: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { user, isLoaded } = useUser();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageUrl = user?.hasImage ? user.imageUrl : null;

  async function run(kind: "upload" | "remove", file: File | null) {
    if (!user) return;
    setBusy(kind);
    onBusyChange?.(true);
    setError(null);
    try {
      await user.setProfileImage({ file: file && (await shrink(file)) });
      await user.reload();
    } catch (err) {
      console.error("Profile photo update failed:", err);
      setError(
        kind === "upload"
          ? "That photo couldn't be uploaded. Try a different one."
          : "Your photo couldn't be removed. Try again.",
      );
    } finally {
      setBusy(null);
      onBusyChange?.(false);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // so picking the same photo again still fires
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a photo (JPG or PNG).");
      return;
    }
    void run("upload", file);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} imageUrl={imageUrl} size={80} />
      <div>
        <input ref={input} type="file" accept="image/*" onChange={onPick} className="hidden" />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={!isLoaded || busy !== null}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-surface px-4 font-semibold transition active:opacity-80 disabled:opacity-60"
          >
            {busy === "upload" ? (
              <>
                <Spinner className="h-4 w-4" /> Uploading…
              </>
            ) : imageUrl ? (
              "Change photo"
            ) : (
              "Add a photo"
            )}
          </button>
          {imageUrl && (
            <button
              type="button"
              onClick={() => void run("remove", null)}
              disabled={busy !== null}
              className="h-11 font-semibold text-muted underline underline-offset-2 disabled:opacity-60"
            >
              {busy === "remove" ? "Removing…" : "Remove"}
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-1 text-[15px] text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
