"use client";

import Link from "next/link";
import { useDevice } from "./device";
import { InAppBrowserNote, InstallSteps } from "./install-steps";
import { card, primaryButton } from "./ui";

export default function SignedOut() {
  const device = useDevice();

  if (!device) {
    return (
      <section className={card}>
        <p className="text-muted">Checking this device…</p>
      </section>
    );
  }

  if (device.isInApp) {
    return (
      <section className={card}>
        <h2 className="font-serif text-2xl leading-tight">Open in your browser</h2>
        <InAppBrowserNote />
      </section>
    );
  }

  if (device.isIOS && !device.isStandalone) {
    return (
      <section className={card}>
        <h2 className="font-serif text-2xl leading-tight">Get KTP Hub</h2>
        <InstallSteps />
      </section>
    );
  }

  return (
    <section className={card}>
      <h2 className="font-serif text-2xl leading-tight">Sign in</h2>
      <p className="mt-2">
        Use the email the chapter has on file. We&apos;ll email you a code, so there&apos;s no
        password.
      </p>
      <Link href="/sign-in" className={primaryButton}>
        Sign in with email
      </Link>
    </section>
  );
}
