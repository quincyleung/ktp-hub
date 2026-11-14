import PushSetup from "./push-setup";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-10">
      <header className="mb-6">
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-accent">
          Kappa Theta Pi
        </p>
        <h1 className="font-serif text-4xl leading-tight">KTP Hub</h1>
        <p className="mt-2 text-muted">Chapter events and announcements, sent to your phone.</p>
      </header>

      <PushSetup />

      <p className="mt-8 text-center text-xs text-muted">Early test version</p>
    </main>
  );
}
