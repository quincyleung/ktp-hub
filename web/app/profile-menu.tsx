"use client";

import { UserButton } from "@clerk/nextjs";
import { PeopleIcon, SettingsIcon } from "./icons";

// The profile picture at the top right: Clerk's account menu, plus My profile and Settings.
export default function ProfileMenu() {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link label="My profile" labelIcon={<PeopleIcon className="h-4 w-4" />} href="/me" />
        <UserButton.Link label="Settings" labelIcon={<SettingsIcon className="h-4 w-4" />} href="/settings" />
      </UserButton.MenuItems>
    </UserButton>
  );
}
