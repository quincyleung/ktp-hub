import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter is close to the iPhone's own font. Greek is for the ΚΘΠ letters.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "greek"],
});

export const metadata: Metadata = {
  title: "KTP Hub",
  description: "Our chapter's events and announcements, with notifications.",
  appleWebApp: { capable: true, title: "KTP Hub", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#234c8b",
  // Lets the tab bar sit above the iPhone home indicator (safe-area padding).
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans text-[17px] leading-normal">
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          appearance={{
            variables: { colorPrimary: "#234c8b" },
            // Clerk's forms ease in like the app's pages.
            elements: { rootBox: "animate-page-in motion-reduce:animate-none" },
          }}
          localization={{
            signUp: {
              start: {
                // The app knows members by the email on the chapter roster.
                subtitle: "In the chapter? Use the email the chapter has on file. Anyone else can join as a guest.",
              },
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
