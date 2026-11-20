import Link from "next/link";
import { GOAL, requirement, type LeaderRow, type Tally } from "@/lib/points";
import type { CheckinSummary, HistoryItem } from "@/lib/points-data";
import { quarterLabel } from "@/lib/quarters";
import { clockTime, timeAgo } from "@/lib/time";
import Avatar from "./avatar";
import { CheckIcon, ChevronLeft, ChevronRight } from "./icons";
import { card, sectionTitle } from "./ui";

// The Points tab: your total this quarter as a ring, each requirement, the
// top 10, and every check-in or entry that added up to it.

/** Arrows to step between quarters, when there's more than one. */
export function QuarterSwitcher({ quarter, quarters }: { quarter: string; quarters: string[] }) {
  const i = quarters.indexOf(quarter);
  const prev = i > 0 ? quarters[i - 1] : null;
  const next = i >= 0 && i < quarters.length - 1 ? quarters[i + 1] : null;
  const arrow = "flex h-9 w-9 items-center justify-center rounded-lg text-accent";
  if (!prev && !next) return <span className="text-[15px] font-semibold text-muted">{quarterLabel(quarter)}</span>;
  return (
    <div className="flex items-center">
      {prev ? (
        <Link href={`/points?q=${prev}`} aria-label={`Back to ${quarterLabel(prev)}`} className={arrow}>
          <ChevronLeft className="h-5 w-5" />
        </Link>
      ) : (
        <span className={`${arrow} opacity-30`} aria-hidden="true">
          <ChevronLeft className="h-5 w-5" />
        </span>
      )}
      <span className="text-[15px] font-semibold">{quarterLabel(quarter)}</span>
      {next ? (
        <Link href={`/points?q=${next}`} aria-label={`On to ${quarterLabel(next)}`} className={arrow}>
          <ChevronRight className="h-5 w-5" />
        </Link>
      ) : (
        <span className={`${arrow} opacity-30`} aria-hidden="true">
          <ChevronRight className="h-5 w-5" />
        </span>
      )}
    </div>
  );
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The big ring: points so far out of 100. */
export function Summary({ tally, isCurrent }: { tally: Tally; isCurrent: boolean }) {
  const filled = Math.min(tally.total, GOAL) / GOAL;
  return (
    <section className={`${card} mt-4 flex items-center gap-5`} aria-label="Your points">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="9" className="stroke-line" />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${filled * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            className="stroke-accent transition-[stroke-dasharray] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[34px] font-extrabold leading-none tracking-tight">{tally.total}</span>
          <span className="mt-1 text-[13px] font-semibold text-muted">of {GOAL}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight tracking-tight">
          {tally.toGo === 0 ? "You hit 100" : `${tally.toGo} to go`}
        </p>
        <p className="mt-1 text-[15px] text-muted">
          {isCurrent ? `${GOAL} points needed this quarter` : `${GOAL} points were needed`}
        </p>
        <p
          className={`mt-3 inline-flex rounded-full px-2.5 py-0.5 text-sm font-bold ${
            tally.duesPaid ? "bg-accent/10 text-accent" : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
          }`}
        >
          {tally.duesPaid ? "Dues paid" : "Dues not paid yet"}
        </p>
      </div>
    </section>
  );
}

/** One bar per requirement. */
export function Requirements({ tally }: { tally: Tally }) {
  return (
    <section className="mt-6">
      <h2 className={sectionTitle}>Requirements</h2>
      <ul className={`${card} mt-3 space-y-4 py-4`}>
        {tally.rows.map((r) => {
          const bonusEarned = r.counted > r.required;
          return (
            <li key={r.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5 font-semibold">
                  {r.met && <CheckIcon className="h-4 w-4 shrink-0 text-accent [stroke-width:3]" />}
                  <span className="truncate">{r.label}</span>
                </span>
                <span className="shrink-0 text-[15px] tabular-nums text-muted">
                  {r.key === "dues" ? (
                    r.met ? "Paid" : "Not paid"
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">{r.counted}</span> / {r.required}
                      {bonusEarned && <span className="font-semibold text-accent"> +{r.counted - r.required}</span>}
                    </>
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(100, (r.counted / r.required) * 100)}%` }}
                />
              </div>
              {r.bonus && r.met && !bonusEarned && <p className="mt-1 text-[13px] text-muted">{r.bonus}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function LeaderItem({ row, me }: { row: LeaderRow; me: boolean }) {
  return (
    <li className={`flex items-center gap-3 rounded-xl px-2 py-2 ${me ? "bg-accent/10" : ""}`}>
      <span
        className={`w-6 shrink-0 text-center font-bold tabular-nums ${row.rank <= 3 ? "text-accent" : "text-muted"}`}
      >
        {row.rank}
      </span>
      <Avatar name={row.name} imageUrl={row.imageUrl} size={36} />
      <span className="min-w-0 flex-1 truncate font-semibold">
        {row.name}
        {me && row.name !== "You" && <span className="font-normal text-muted"> (you)</span>}
      </span>
      <span className="shrink-0 font-bold tabular-nums">{row.total}</span>
    </li>
  );
}

/** The top 10, plus your own place if you're not in it. */
export function Leaderboard({ leaders, myRank }: { leaders: LeaderRow[]; myRank: LeaderRow | null }) {
  const inTop = myRank && leaders.some((l) => l.id === myRank.id);
  return (
    <section className="mt-6">
      <h2 className={sectionTitle}>Leaderboard</h2>
      {leaders.length === 0 ? (
        <p className="mt-2 text-muted">No points yet this quarter.</p>
      ) : (
        <ol className={`${card} mt-3 space-y-0.5 p-2`}>
          {leaders.map((row) => (
            <LeaderItem key={row.id} row={row} me={row.id === myRank?.id} />
          ))}
          {myRank && !inTop && (
            <>
              <li aria-hidden="true" className="py-0.5 text-center text-muted">
                ⋯
              </li>
              <LeaderItem row={myRank} me />
            </>
          )}
        </ol>
      )}
    </section>
  );
}

/** Every entry that added up to your points, newest first. */
export function History({ items, now, empty }: { items: HistoryItem[]; now: Date; empty: string }) {
  return (
    <section className="mt-6">
      <h2 className={sectionTitle}>Your points</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-muted">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{item.note || requirement(item.category).label}</span>
                <span className="block text-[15px] text-muted">
                  {requirement(item.category).label} · {timeAgo(new Date(item.at), now)}
                </span>
              </span>
              <span
                className={`shrink-0 font-bold tabular-nums ${item.points > 0 ? "text-accent" : "text-red-600 dark:text-red-400"}`}
              >
                {item.points > 0 ? `+${item.points}` : item.points}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** For the board and committee leads: this quarter's check-ins. */
export function CheckinList({ checkins, now }: { checkins: CheckinSummary[]; now: Date }) {
  if (checkins.length === 0) return null;
  return (
    <ul className="mt-3 divide-y divide-line">
      {checkins.map((c) => {
        const open = Date.parse(c.startsAt) <= now.getTime() && now.getTime() < Date.parse(c.endsAt);
        return (
          <li key={c.id}>
            <Link href={`/checkin/${c.id}`} className="flex items-center gap-3 py-3 transition active:opacity-70">
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-semibold">{c.title}</span>
                  {open && (
                    <span className="shrink-0 rounded-full bg-navy px-2 py-0.5 text-[11px] font-bold text-white">
                      Open
                    </span>
                  )}
                </span>
                <span className="block text-[15px] text-muted">
                  {requirement(c.category).label} · {c.points} pts ·{" "}
                  {open ? `until ${clockTime(new Date(c.endsAt))}` : timeAgo(new Date(c.startsAt), now)}
                </span>
              </span>
              <span className="shrink-0 text-[15px] text-muted">
                {c.count} {c.count === 1 ? "brother" : "brothers"}
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
