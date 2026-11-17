import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/people";
import { gradYearOptions } from "@/lib/profile-fields";
import { getViewer } from "@/lib/viewer";
import BackButton from "../../../back-button";
import ProfileForm from "../../../profile-form";
import { pageTitle } from "../../../ui";
import { PageSuspense } from "../../../spinner";

export const metadata: Metadata = { title: "Edit profile · KTP Hub" };

export default function EditProfilePage() {
  return (
    <PageSuspense label="Loading your profile">
      <BackButton />
      <h1 className={pageTitle}>Edit your profile</h1>
      <EditProfile />
    </PageSuspense>
  );
}

async function EditProfile() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (!viewer.memberId) return <p className="mt-2 text-muted">Profiles are for chapter members.</p>;
  const profile = await getProfile(viewer.memberId);
  if (!profile) {
    return <p className="mt-2 text-muted">Your profile couldn&apos;t load. Close and reopen the app to try again.</p>;
  }
  return <ProfileForm profile={profile} years={gradYearOptions(new Date(), profile.year)} />;
}
