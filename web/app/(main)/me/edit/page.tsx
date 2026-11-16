import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/people";
import { gradYearOptions } from "@/lib/profile-fields";
import { getViewer } from "@/lib/viewer";
import BackButton from "../../../back-button";
import ProfileForm from "../../../profile-form";
import { pageTitle } from "../../../ui";
import { Loading } from "../../../spinner";

export const metadata: Metadata = { title: "Edit profile · KTP Hub" };

export default function EditProfilePage() {
  return (
    <>
      <BackButton />
      <h1 className={pageTitle}>Edit your profile</h1>
      <Suspense fallback={<Loading />}>
        <EditProfile />
      </Suspense>
    </>
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
