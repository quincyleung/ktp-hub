"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import PhotoPicker from "./photo-picker";
import { saveBasics } from "./profile-actions";
import { GradYearSelect, ListInputs } from "./profile-fields";
import { Spinner } from "./spinner";
import { primaryButton } from "./ui";

export default function OnboardingForm({
  name,
  years,
  year,
  majors,
  minors,
}: {
  name: string;
  years: string[];
  year: string | null;
  majors: string[];
  minors: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const r = await saveBasics(data);
      if (r.ok) router.replace("/");
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <div>
        <p className="font-semibold">Profile photo</p>
        <p className="mb-3 text-[15px] text-muted">So brothers can put a face to your name.</p>
        <PhotoPicker name={name} onBusyChange={setUploading} />
      </div>

      <GradYearSelect years={years} defaultValue={year} />

      <ListInputs
        name="major"
        label="Major"
        noun="major"
        initial={majors}
        required
        placeholder="e.g. Computer Science, or Undeclared"
        addFirst="Add a major"
        addMore="Add another major"
      />

      <ListInputs
        name="minor"
        label="Minor"
        noun="minor"
        initial={minors}
        placeholder="e.g. Economics"
        addFirst="Add a minor"
        addMore="Add another minor"
      />

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-[15px] text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <button type="submit" className={primaryButton} disabled={pending || uploading}>
          {pending || uploading ? (
            <>
              <Spinner /> {pending ? "Saving…" : "Uploading photo…"}
            </>
          ) : (
            "Continue"
          )}
        </button>
        <p className="mt-3 text-center text-[15px] text-muted">
          You can change these anytime from your profile.
        </p>
      </div>
    </form>
  );
}
