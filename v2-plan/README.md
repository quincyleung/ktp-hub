# KTP Hub: plan for v2

KTP Hub is our UChicago Kappa Theta Pi chapter's app: https://uchicago-ktphub.vercel.app

In v1, a brother can sign in, add the app to their home screen, turn on notifications, and get a
notification when the board posts an announcement or an hour before an event. Home shows
announcements and the next few events, Calendar shows the chapter's Google Calendar, and People is
the chapter directory.

v2 is due at the project fair on December 1.

## What I saw when a brother used v1

I tested v1 with one brother who is also on the board, on an iPhone, using Chrome. They completed the core task from start
to finish: signed up, added the app to their home screen, turned on notifications, and got a
notification. They thought it was intuitive, and they liked the features and the notifications.

They asked for three more things:

- Being able to track if people paid dues (dues are also a requirement).
- Being able to sign up for events and committees, and say if you're going.
- For the board: seeing the budget, requesting funding, and submitting purchase receipts.

Nothing in the core task needed fixing, so v2 is mostly about adding features: the ones my tester
asked for, plus the ones I already wanted.

## How I'll know v2 worked

People are using the app frequently, we have higher attendance, and our info is more up to date.

- **Using it frequently:** how many brothers open the app each week, and how many have notifications on.
- **Higher attendance:** check-ins per chapter meeting, committee, and event, compared with this
  quarter's attendance sheet.
- **More up-to-date info:** points show up the same day someone checks in, instead of weeks later.
  Right now the board copies attendance into the points sheet by hand, so it falls behind.

## What I'll add

### 1. A Points tab

Brothers should see how many points they have so far this quarter, a leaderboard, and their points
from earlier quarters this year.

Points are on a spreadsheet right now. Putting them in the app makes them easier to check and keep
up to date. Instead of the board taking attendance and copying it over, brothers scan a QR code to
check in at committees, events, and chapter meetings, and the points are added right away.

What a brother sees:

- **This quarter:** points so far, by requirement (chapter, dues, committee, service and fundraising,
  membership and rush, social), and what's left to reach 100.
- **Dues:** whether you've paid. Dues are a requirement too, and my tester asked to be able to
  track them. The board marks who has paid, and everyone sees their own status.
- **Leaderboard:** who has the most points this quarter.
- **Earlier quarters:** points from past quarters this year.
- **Check in:** scan the QR code at a committee, event, or chapter meeting.

The board will still enter points that don't come from a check-in.

Questions to settle before building it:

- How do we stop someone from checking in from a photo of the code sent to a group chat? For
  example, the code could change every 30 seconds on a board member's phone, or check-in could only
  work during the event.
- Should the leaderboard show everyone or only the top 10?
- How do we bring this year's earlier quarters in from the sheet?

### 2. Signing up for events and committees (RSVP)

Brothers can sign up for events and committees, say if they're going, and see who else is going.
Members asked for this in the survey, and my tester asked for it too.

### 3. A page of important files and links

One place for the documents and links the chapter uses all the time. Members asked for this in the
survey too.

### 4. Filters on People

Filter the directory by major or graduation year, to make it easier to sift through. For example,
find everyone studying economics, or everyone graduating in 2028.

### 5. Turning on notifications during sign-up

Right now, notifications can only be turned on in Settings. New brothers should be asked once while
they set up their profile, so they don't miss it.

### 6. Budget and funding for the board

The board can see the budget, request funding, and submit purchase receipts in the app. My tester,
who is on the board, asked for this.

Questions to settle before building it:

- Who approves a funding request, and how do they get notified?
- Where do the budget numbers and receipts live today, and how do we bring them in?

## What I'll change

### Close the app to guests again

For the course, anyone can sign up as a guest and see the same app as members, so graders can try
everything. After the course, only chapter members will see the chapter's posts and events, get
notifications, and see People.

### Hand KTP Hub over to the chapter

I graduate this year, so the app has to belong to the chapter. I'll move the database (Supabase),
hosting (Vercel), sign-in (Clerk), and code (GitHub) from my personal accounts to the chapter's
KTP account. The web address and notification keys have to stay the same, or every brother would
need to reinstall the app and turn notifications on again.

### More testing

I've only tested with one brother, who is on the board, on an iPhone. Next, I'll test the full
member path (sign in,
install, turn on notifications, get a post) on both iPhone and Android with the 13 brothers who
volunteered in the survey.

## Smaller fixes

- Remove database columns left over from a demo chapter that's no longer used.
- Fix the GitHub-to-Vercel connection, so every commit stops showing a failed build.
- Check that the "Add to Google Calendar" link works on phones (it's only been checked on a
  computer).
- Turn on Claude Code's sandbox, so AI agents can't open the `.env` file through shell commands
  either. Right now the deny rule only blocks its file-reading tool.

## Timeline

| When | What |
| --- | --- |
| Nov 17–24 | Test v1 with the board and survey volunteers on iPhone and Android. Fix anything they run into. |
| Nov 24–30 (Thanksgiving break) | Build Points (QR check-in, dues, my points, leaderboard, earlier quarters), sign-ups and RSVP, the files and links page, People filters, the notification step in sign-up, and the board's budget and funding requests. |
| Dec 1 | Project fair: v2. |
| After the course | Close the app to guests. Hand it over to the chapter's accounts. |
