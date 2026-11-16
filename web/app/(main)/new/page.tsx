import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import BackButton from "../../back-button";
import PostForm from "../../post-form";
import { pageTitle } from "../../ui";
import { Loading } from "../../spinner";

export const metadata: Metadata = { title: "New post · KTP Hub" };

// Board only: the + buttons on Home open this, with ?kind=event or ?kind=announcement.
export default function NewPostPage({ searchParams }: PageProps<"/new">) {
  return (
    <>
      <BackButton />
      <h1 className={pageTitle}>New post</h1>
      <Suspense fallback={<Loading />}>
        <NewPost searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function NewPost({ searchParams }: Pick<PageProps<"/new">, "searchParams">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (viewer.role !== "board") {
    return <p className="mt-4">Only board members can post.</p>;
  }
  const { kind } = await searchParams;
  return <PostForm initialKind={kind === "announcement" ? "announcement" : "event"} />;
}
