"use client";

import Link from "next/link";
import { useDevice } from "./device";
import { InAppBrowserNote, InstallSteps } from "./install-steps";
import { Spinner } from "./spinner";
import { card, primaryButton, sectionTitle } from "./ui";

export default function SignedOut() {
  const device = useDevice();

  if (!device) {
    return (
      <section className={card}>
        <p className="flex items-center gap-2 text-muted">
          <Spinner className="h-4 w-4" /> Checking this device…
        </p>
      </section>
    );
  }

  if (device.isInApp) {
    return (
      <section className={card}>
        <h2 className={sectionTitle}>Open in your browser</h2>
        <InAppBrowserNote />
      </section>
    );
  }

  if (device.isIOS && !device.isStandalone) {
    return (
      <section className={card}>
        <h2 className={sectionTitle}>Get KTP Hub</h2>
        <InstallSteps />
      </section>
    );
  }

  return (
    <section className={card}>
      <h2 className={sectionTitle}>Sign in</h2>
      <p className="mt-2">
        Use the email the chapter has on file. We&apos;ll email you a code, so there&apos;s no
        password.
      </p>
      <p className="mt-2 text-[15px] text-muted">
        Not in the chapter? Any email works. You&apos;ll sign in as a guest.
      </p>
      <Link href="/sign-in" className={primaryButton}>
        Sign in with email
      </Link>
    </section>
  );
}
