import { pageTitle } from "./ui";

// A page's big title, a gray line under it, and an optional button on the right.
export default function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className={pageTitle}>{title}</h1>
        {subtitle && <p className="mt-0.5 text-[15px] text-muted">{subtitle}</p>}
      </div>
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
