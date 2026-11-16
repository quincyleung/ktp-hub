"use client";

import Link from "next/link";
import { useState } from "react";
import type { Person } from "@/lib/people";
import type { MemberType } from "@/lib/roles";
import Avatar from "./avatar";
import { ChevronRight, SearchIcon } from "./icons";
import { chip } from "./ui";

const GROUPS: { key: string; label: string; noun: string; includes: MemberType[] }[] = [
  { key: "brothers", label: "Brothers", noun: "brothers", includes: ["brother", "board"] },
  { key: "board", label: "E-Board", noun: "e-board members", includes: ["board"] },
  { key: "alumni", label: "Alumni", noun: "alumni", includes: ["alumni"] },
  { key: "pledges", label: "Pledges", noun: "pledges", includes: ["pledge"] },
];

// The chapter directory: tabs for Brothers, E-Board, Alumni and Pledges, and a
// search box. Tapping someone opens their profile.
export default function PeopleView({
  people,
  isBoard,
  myId,
}: {
  people: Person[];
  isBoard: boolean;
  myId: string | null;
}) {
  const [groupKey, setGroupKey] = useState("brothers");
  const [query, setQuery] = useState("");
  const group = GROUPS.find((g) => g.key === groupKey) ?? GROUPS[0];

  const inGroup = people.filter((p) => group.includes.includes(p.type));
  const q = query.trim().toLowerCase();
  const shown = q
    ? inGroup.filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
    : inGroup;

  return (
    <div className="mt-4">
      <div
        role="tablist"
        aria-label="Groups"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
      >
        {GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            role="tab"
            aria-selected={g.key === groupKey}
            onClick={() => setGroupKey(g.key)}
            className={chip(g.key === groupKey)}
          >
            {g.label}
          </button>
        ))}
      </div>

      <label className="relative mt-3 block">
        <span className="sr-only">Search</span>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${inGroup.length} ${group.noun}`}
          className="block h-11 w-full rounded-xl border border-transparent bg-surface pl-10 pr-3 text-[17px] outline-none placeholder:text-muted focus:border-accent focus:bg-background"
        />
      </label>

      {shown.length === 0 ? (
        <div className="mt-6 text-muted">
          <p>{q ? `No ${group.noun} match "${query}".` : `No ${group.noun} yet.`}</p>
          {!q && isBoard && (group.key === "alumni" || group.key === "pledges") && (
            <p className="mt-2 text-[15px]">
              To add them, set Status to {group.key === "alumni" ? "Alumni" : "Pledge"} in the roster
              sheet and run the roster import again.
            </p>
          )}
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {shown.map((p) => (
            <li key={p.id}>
              <Link href={`/people/${p.id}`} className="flex items-center gap-3 py-3 transition active:opacity-70">
                <Avatar name={p.name} imageUrl={p.imageUrl} size={48} />
                <span className="min-w-0 flex-1">
                  {p.pronouns && (
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-accent">
                      {p.pronouns}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <span className="truncate font-bold">{p.name}</span>
                    {p.type === "board" && (
                      <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
                        E-Board
                      </span>
                    )}
                    {p.id === myId && <span className="shrink-0 text-sm text-muted">(you)</span>}
                  </span>
                  {(p.major || p.year) && (
                    <span className="block truncate text-[15px] text-muted">
                      {[p.major, p.year].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
