import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KTP Hub",
  description: "Our chapter's events and announcements, with notifications.",
  appleWebApp: { capable: true, title: "KTP Hub", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#234c8b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sourceSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans text-[17px] leading-relaxed">
        <ClerkProvider signInUrl="/sign-in" appearance={{ variables: { colorPrimary: "#234c8b" } }}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
