// A round photo, or initials when someone hasn't added a photo.
const COLORS = [
  "bg-[#234c8b] text-white",
  "bg-[#8bb9ff] text-[#0d1424]",
  "bg-[#dbe7fb] text-[#234c8b]",
  "bg-[#3d6fb8] text-white",
];

function initials(name: string) {
  const words = name.trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

function colorFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({
  name,
  imageUrl,
  size = 48,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
}) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };
  if (imageUrl) {
    return (
      // Photos are small and come from the sign-in service, so a plain img is fine.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="shrink-0 rounded-full object-cover"
        style={style}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${colorFor(name)}`}
      style={style}
    >
      {initials(name)}
    </span>
  );
}
