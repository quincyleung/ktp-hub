"use client";

import { useClerk } from "@clerk/nextjs";
import { ChevronRight } from "./icons";

const row = "flex w-full items-center justify-between px-4 py-3 text-left font-semibold transition active:opacity-70";

/** Opens the sign-in service's account screen: password, email, signed-in devices, delete account. */
export function AccountRow() {
  const { openUserProfile } = useClerk();
  return (
    <button type="button" className={row} onClick={() => openUserProfile()}>
      <span>
        <span className="block">Password and email</span>
        <span className="block text-sm font-normal text-muted">Also signed-in devices and deleting your account</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
    </button>
  );
}

export function SignOutRow() {
  const { signOut } = useClerk();
  return (
    <button type="button" className={`${row} text-red-600 dark:text-red-400`} onClick={() => signOut({ redirectUrl: "/" })}>
      Sign out
    </button>
  );
}
