import { pageTitle } from "./ui";

// A page's big title, with an optional button on the right.
export default function PageHeader({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <h1 className={`${pageTitle} min-w-0`}>{title}</h1>
      {children}
    </header>
  );
}

// The app's mark: the chapter's letters on a blue tile.
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-[28%] bg-navy font-bold tracking-tight text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      ΚΘΠ
    </span>
  );
}
