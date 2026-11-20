import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// The home page is public: on iPhone, people install the app before signing in.
// The page itself checks who's signed in, and so does every server action.
// /api/reminders is called by a timer, not a person; it checks its own secret.
// /c/... is a check-in code's link: opened signed out (from a camera app), it
// says to scan with the app instead.
const isPublic = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/api/reminders", "/c/(.*)"]);

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublic(req)) await auth.protect();
  },
  { signInUrl: "/sign-in" },
);

export const config = {
  matcher: [
    // Skip Next.js internals and static files (including sw.js and the manifest).
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
