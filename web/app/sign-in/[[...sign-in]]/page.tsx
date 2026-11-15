import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 pb-16 pt-10">
      {/* SignIn reads the URL at runtime, so it streams in behind Suspense. */}
      <Suspense fallback={<p className="text-muted">Loading sign-in…</p>}>
        {/* withSignUp: a new email signs up in the same flow, no separate page. */}
        <SignIn path="/sign-in" withSignUp fallbackRedirectUrl="/" />
      </Suspense>
    </main>
  );
}
