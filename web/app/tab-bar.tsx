"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, HomeIcon, PeopleIcon, ScanIcon, TrophyIcon } from "./icons";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/checkin", label: "Check in", Icon: ScanIcon }, // the round button in the middle
  { href: "/points", label: "Points", Icon: TrophyIcon },
  { href: "/people", label: "People", Icon: PeopleIcon },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 animate-fade-in border-t border-line bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          if (href === "/checkin") {
            // Check in: a big round button that sits up out of the bar, easy to hit at an event.
            return (
              <li key={href} className="flex justify-center">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="-mt-5 flex flex-col items-center gap-0.5 transition active:scale-95"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-white shadow-lg ring-4 ring-background">
                    <Icon className="h-7 w-7" />
                  </span>
                  <span className={`text-xs ${active ? "font-bold text-accent" : "font-semibold text-muted"}`}>
                    {label}
                  </span>
                </Link>
              </li>
            );
          }
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex h-16 items-center justify-center"
              >
                {/* The current tab gets a shaded pill behind its icon and label. */}
                <span
                  className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-xs transition-colors ${
                    active ? "bg-accent/15 font-bold text-accent" : "font-semibold text-muted"
                  }`}
                >
                  <Icon className={active ? "h-6 w-6 [stroke-width:2.5]" : "h-6 w-6"} />
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
