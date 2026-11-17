import { Suspense } from "react";
import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { PageLoading } from "../../spinner";

export const metadata: Metadata = { title: "Log In · KTP Hub" };

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 pb-16 pt-[calc(env(safe-area-inset-top)+2.5rem)]">
      {/* SignIn reads the URL at runtime, so it streams in behind Suspense.
          Then the spinner stays until Clerk's form is ready. */}
      <Suspense fallback={<PageLoading label="Loading log in" />}>
        {/* withSignUp: a new email signs up in the same flow. */}
        <SignIn path="/sign-in" withSignUp fallbackRedirectUrl="/" fallback={<PageLoading label="Loading log in" />} />
      </Suspense>
    </main>
  );
}
