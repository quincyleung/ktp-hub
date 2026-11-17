import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import BackButton from "../../back-button";
import PostForm from "../../post-form";
import { pageTitle } from "../../ui";
import { PageSuspense } from "../../spinner";

export const metadata: Metadata = { title: "New announcement · KTP Hub" };

// Board only: the + button next to Announcements on Home opens this.
export default function NewPostPage() {
  return (
    <PageSuspense>
      <BackButton />
      <h1 className={pageTitle}>New announcement</h1>
      <NewPost />
    </PageSuspense>
  );
}

async function NewPost() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (viewer.role !== "board") {
    return <p className="mt-4">Only board members can post.</p>;
  }
  return <PostForm />;
}
