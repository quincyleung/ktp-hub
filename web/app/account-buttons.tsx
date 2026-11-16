"use client";

import { useClerk } from "@clerk/nextjs";
import { secondaryButton } from "./ui";

/** Opens the sign-in account screen: email, photo, and devices signed in. */
export function ManageAccountButton() {
  const { openUserProfile } = useClerk();
  return (
    <button type="button" className={secondaryButton} onClick={() => openUserProfile()}>
      Manage your account
    </button>
  );
}

export function SignOutButton() {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/" })}
      className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-red-500/10 font-semibold text-red-700 transition active:opacity-80 dark:text-red-300"
    >
      Sign out
    </button>
  );
}
