"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { useCallback, useRef, useState } from "react";
import Avatar from "./avatar";
import { PeopleIcon, SettingsIcon } from "./icons";
import { useDismiss } from "./use-dismiss";

const item = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold transition-colors hover:bg-surface";

// The profile picture at the top right: My profile, Settings, Sign out.
// (Password and email live in Settings → Account.)
export default function ProfileMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(box, open, close);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Your account"
        className="flex h-11 w-11 items-center justify-center rounded-full"
      >
        {user ? (
          <Avatar name={user.fullName ?? user.primaryEmailAddress?.emailAddress ?? ""} imageUrl={user.hasImage ? user.imageUrl : null} size={34} />
        ) : (
          <span className="h-[34px] w-[34px] rounded-full bg-surface" />
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-52 animate-fade-in rounded-2xl border border-line bg-background p-1.5 shadow-lg motion-reduce:animate-none"
        >
          <Link role="menuitem" href="/me" onClick={close} className={item}>
            <PeopleIcon className="h-5 w-5 text-muted" /> My profile
          </Link>
          <Link role="menuitem" href="/settings" onClick={close} className={item}>
            <SettingsIcon className="h-5 w-5 text-muted" /> Settings
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => signOut({ redirectUrl: "/" })}
            className={`${item} text-red-600 dark:text-red-400`}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
