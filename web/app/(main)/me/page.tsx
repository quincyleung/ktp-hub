import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { PageSuspense } from "../../spinner";

// "My profile" in the profile-picture menu: opens your own profile page.
export default function MePage() {
  return (
    <PageSuspense>
      <GoToMyProfile />
    </PageSuspense>
  );
}

async function GoToMyProfile() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (!viewer.memberId) {
    return <p className="pt-8 text-center text-muted">You&apos;re signed in as a guest.</p>;
  }
  redirect(`/people/${viewer.memberId}`);
}
