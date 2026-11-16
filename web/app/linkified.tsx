// Turns http(s) links in post text (like Partiful links) into tappable links.
const URL_PATTERN = /(https?:\/\/[^\s<]*[^\s<.,;:!?)\]'"])/g;

export default function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(URL_PATTERN).map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-semibold text-accent underline underline-offset-2"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}
