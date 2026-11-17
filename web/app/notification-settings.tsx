"use client";

import { ChevronRight } from "./icons";
import { InAppBrowserNote, InstallSteps } from "./install-steps";
import { BlockedNote, PushFeedback, UnsupportedNote, usePush } from "./push-setup";
import { Spinner } from "./spinner";

// An on/off switch, like iPhone Settings.
function Switch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${
        checked ? "bg-navy" : "bg-line"
      }`}
    >
      <span
        className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform duration-200 motion-reduce:transition-none ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

// Settings → Notifications: a switch for this phone; once it's on, a switch for
// event reminders (board announcements always come) and a test.
export default function NotificationSettings() {
  const { device, canPush, status, busy, message, error, reminders, turnOn, turnOff, toggleReminders, sendTest } =
    usePush();

  // Flip the switch right away while it works, so the tap feels instant.
  const on = busy === "on" ? true : busy === "off" ? false : status === "on";
  const usable = canPush && (status === "ready" || status === "on");

  let note: React.ReactNode = null;
  if (device?.isInApp) note = <InAppBrowserNote />;
  else if (device?.isIOS && !device.isStandalone) {
    note = (
      <>
        <p className="mt-2">Notifications work once KTP Hub is on your home screen.</p>
        <InstallSteps />
      </>
    );
  } else if (status === "unsupported") note = <UnsupportedNote />;
  else if (status === "blocked") note = <BlockedNote />;

  return (
    <>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">
        <li className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="min-w-0">
            <span className="block font-semibold">Push notifications</span>
            <span className="block text-sm text-muted">
              On this phone
            </span>
          </span>
          <Switch
            checked={on}
            disabled={!usable || busy !== null}
            onChange={on ? turnOff : turnOn}
            label="Push notifications on this phone"
          />
        </li>
        {status === "on" && (
          <li className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="min-w-0">
              <span className="block font-semibold">Event reminders</span>
              <span className="block text-sm text-muted">An hour before each event</span>
            </span>
            <Switch
              checked={reminders}
              disabled={busy !== null}
              onChange={toggleReminders}
              label="Event reminders"
            />
          </li>
        )}
        {status === "on" && (
          <li>
            <button
              type="button"
              onClick={sendTest}
              disabled={busy !== null}
              className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold disabled:opacity-60"
            >
              Send a test notification
              {busy === "test" ? <Spinner className="h-5 w-5 text-muted" /> : <ChevronRight className="h-5 w-5 text-muted" />}
            </button>
          </li>
        )}
      </ul>
      {note && <div className="mt-3 animate-fade-in px-1 motion-reduce:animate-none">{note}</div>}
      <PushFeedback message={message} error={error} />
    </>
  );
}
