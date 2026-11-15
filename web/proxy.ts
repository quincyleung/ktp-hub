import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// The home page is public: on iPhone, people install the app before signing in.
// The page itself checks who's signed in, and so does every server action.
const isPublic = createRouteMatcher(["/", "/sign-in(.*)"]);

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
