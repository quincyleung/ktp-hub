import { Suspense } from "react";
import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { PageLoading } from "../../spinner";

export const metadata: Metadata = { title: "Sign Up · KTP Hub" };

// The "use the email on file" hint is the form's subtitle (set in the root layout),
// so it shows up together with the form.
export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 pb-16 pt-[calc(env(safe-area-inset-top)+2.5rem)]">
      {/* SignUp reads the URL at runtime, so it streams in behind Suspense.
          Then the spinner stays until Clerk's form is ready. */}
      <Suspense fallback={<PageLoading label="Loading sign-up" />}>
        <SignUp path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" fallback={<PageLoading label="Loading sign-up" />} />
      </Suspense>
    </main>
  );
}
