"use client";

import Link from "next/link";
import { useDevice } from "./device";
import { InAppBrowserNote, InstallSteps } from "./install-steps";
import { card, primaryButton, sectionTitle } from "./ui";

const fadeIn = "animate-fade-in motion-reduce:animate-none";

export default function SignedOut() {
  const device = useDevice();

  // The phone check takes a split second after the page loads. Hold the
  // buttons' space quietly (no spinner), then fade them in.
  if (!device) return <div className="min-h-[104px]" aria-hidden="true" />;

  if (device.isInApp) {
    return (
      <section className={`${card} ${fadeIn}`}>
        <h2 className={sectionTitle}>Open in your browser</h2>
        <InAppBrowserNote />
      </section>
    );
  }

  if (device.isIOS && !device.isStandalone) {
    return (
      <section className={`${card} ${fadeIn}`}>
        <h2 className={sectionTitle}>Get KTP Hub</h2>
        <InstallSteps />
      </section>
    );
  }

  // A new email can also use Log In:
  // it carries on into sign-up.
  return (
    <div className={fadeIn}>
      <Link href="/sign-up" className={primaryButton}>
        Sign Up
      </Link>
      <p className="mt-4 text-center text-[15px] text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-accent">
          Log In
        </Link>
      </p>
    </div>
  );
}
