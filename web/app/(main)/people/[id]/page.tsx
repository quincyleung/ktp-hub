import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/people";
import { BADGE } from "@/lib/roles";
import { getViewer } from "@/lib/viewer";
import Avatar from "../../../avatar";
import BackButton from "../../../back-button";
import { LinkedInIcon } from "../../../icons";
import { primaryButton, secondaryButton } from "../../../ui";
import { Loading } from "../../../spinner";

export default function PersonPage({ params }: PageProps<"/people/[id]">) {
  return (
    <>
      <BackButton />
      <Suspense fallback={<Loading />}>
        <ProfileView params={params} />
      </Suspense>
    </>
  );
}

async function ProfileView({ params }: Pick<PageProps<"/people/[id]">, "params">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (viewer.role === "guest") {
    return <p className="text-muted">Profiles are for chapter members only.</p>;
  }
  const { id } = await params;
  const p = await getProfile(id);
  if (!p) notFound();

  const isMe = viewer.memberId === p.id;
  const details = [
    ["Graduation year", p.year],
    [p.major?.includes(",") ? "Majors" : "Major", p.major],
    [p.minor?.includes(",") ? "Minors" : "Minor", p.minor],
    ["Hometown", p.hometown],
    ["Pledge class", p.pledgeClass],
  ].filter((d): d is [string, string] => !!d[1]);
  const empty = details.length === 0 && p.interests.length === 0 && !p.about && !p.linkedin;

  return (
    <article>
      <div className="flex flex-col items-center text-center">
        <Avatar name={p.name} imageUrl={p.imageUrl} size={128} />
        {p.pronouns && (
          <p className="mt-4 text-[13px] font-bold uppercase tracking-wide text-accent">{p.pronouns}</p>
        )}
        <div className={`${p.pronouns ? "" : "mt-4 "}flex items-center gap-2`}>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight">{p.name}</h1>
          {p.linkedin && (
            <a
              href={p.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${p.name} on LinkedIn`}
              className="text-[#0a66c2]"
            >
              <LinkedInIcon className="h-6 w-6" />
            </a>
          )}
        </div>
        <p
          className={`mt-2 rounded-full px-3 py-0.5 text-sm font-bold ${
            p.type === "board" ? "bg-navy text-white" : "bg-accent/10 text-accent"
          }`}
        >
          {p.type === "board" ? "E-Board" : BADGE[p.type]}
        </p>
      </div>

      {details.length > 0 && (
        <dl className="mt-6 divide-y divide-line rounded-2xl bg-surface">
          {details.map(([label, value]) => (
            <div key={label} className="flex gap-3 px-4 py-3">
              <dt className="w-28 shrink-0 font-semibold">{label}</dt>
              <dd className="min-w-0 break-words text-muted">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {p.interests.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Interests">
          {p.interests.map((tag) => (
            <li key={tag} className="rounded-full bg-accent/10 px-3 py-1 text-[15px] font-semibold text-accent">
              {tag}
            </li>
          ))}
        </ul>
      )}

      {p.about && (
        <section className="mt-6">
          <h2 className="font-bold">About me</h2>
          <p className="mt-1 whitespace-pre-line break-words">{p.about}</p>
        </section>
      )}

      {empty && !isMe && (
        <p className="mt-6 text-center text-muted">{p.name.split(" ")[0]} hasn&apos;t filled in their profile yet.</p>
      )}

      {isMe ? (
        <>
          {empty && (
            <p className="mt-6 text-center text-muted">Add your year, major and more so brothers can get to know you.</p>
          )}
          <Link href="/me/edit" className={primaryButton}>
            Edit your profile
          </Link>
        </>
      ) : (
        <a href={`mailto:${p.email}`} className={secondaryButton}>
          Email {p.name.split(" ")[0]}
        </a>
      )}
    </article>
  );
}
