"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Profile } from "@/lib/people";
import { splitList } from "@/lib/profile-fields";
import PhotoPicker from "./photo-picker";
import { updateProfile } from "./profile-actions";
import { GradYearSelect, ListInputs } from "./profile-fields";
import { Spinner } from "./spinner";
import { field, primaryButton, secondaryButton } from "./ui";

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  maxLength,
}: {
  name: string;
  label: string;
  defaultValue: string | null;
  placeholder?: string;
  maxLength: number;
}) {
  return (
    <label className="block">
      <span className="font-semibold">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`mt-1 ${field}`}
      />
    </label>
  );
}

export default function ProfileForm({ profile, years }: { profile: Profile; years: string[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const r = await updateProfile(data);
      if (r.ok) router.push(`/people/${r.id}`);
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <p className="mb-2 font-semibold">Photo</p>
        <PhotoPicker name={profile.name} onBusyChange={setUploading} />
      </div>
      <Field name="pronouns" label="Pronouns" defaultValue={profile.pronouns} placeholder="e.g. she/her" maxLength={30} />
      <GradYearSelect years={years} defaultValue={profile.year} />
      <ListInputs
        name="major"
        label="Major"
        noun="major"
        initial={splitList(profile.major)}
        required
        placeholder="e.g. Computer Science, or Undeclared"
        addFirst="Add a major"
        addMore="Add another major"
      />
      <ListInputs
        name="minor"
        label="Minor"
        noun="minor"
        initial={splitList(profile.minor)}
        placeholder="e.g. Economics"
        addFirst="Add a minor"
        addMore="Add another minor"
      />
      <Field name="hometown" label="Hometown" defaultValue={profile.hometown} maxLength={100} />
      <Field name="pledge_class" label="Pledge class" defaultValue={profile.pledgeClass} placeholder="e.g. Alpha Gamma (Fall '24)" maxLength={60} />
      <Field name="linkedin" label="LinkedIn" defaultValue={profile.linkedin} placeholder="linkedin.com/in/yourname" maxLength={200} />
      <label className="block">
        <span className="font-semibold">Interests</span>{" "}
        <span className="text-muted">(separate with commas)</span>
        <input
          name="interests"
          defaultValue={profile.interests.join(", ")}
          placeholder="e.g. tennis, Studio Ghibli, coffee"
          className={`mt-1 ${field}`}
        />
      </label>
      <label className="block">
        <span className="font-semibold">About me</span>
        <textarea
          name="about"
          rows={5}
          maxLength={1000}
          defaultValue={profile.about ?? ""}
          className={`mt-1 ${field} h-auto py-2`}
        />
      </label>

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
            "Save profile"
          )}
        </button>
        <button type="button" className={secondaryButton} disabled={pending} onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
