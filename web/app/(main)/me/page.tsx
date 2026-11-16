import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { pageTitle } from "../../ui";
import { Loading } from "../../spinner";

// "My profile" in the profile-picture menu: opens your own profile page.
export default function MePage() {
  return (
    <Suspense fallback={<Loading />}>
      <GoToMyProfile />
    </Suspense>
  );
}

async function GoToMyProfile() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (!viewer.memberId) {
    return (
      <>
        <h1 className={pageTitle}>Profiles</h1>
        <p className="mt-2 text-muted">
          Profiles are for chapter members. You&apos;re signed in as a guest.
        </p>
      </>
    );
  }
  redirect(`/people/${viewer.memberId}`);
}
